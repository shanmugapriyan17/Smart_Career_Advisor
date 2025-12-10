"""
Smart Career Advisor - Flask Backend
Handles user authentication, profile management, resume analysis, and career prediction
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import json
import os
from datetime import datetime
import joblib
import re
from functools import wraps
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import numpy as np

# Download NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

app = Flask(__name__)
app.secret_key = 'sca_secret_key_2024'

# Enable CORS for frontend deployment
from flask_cors import CORS
CORS(app)

# Configuration
DATABASE = 'sca.db'
UPLOAD_FOLDER = 'static/uploads'
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {'txt', 'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(os.path.join(UPLOAD_FOLDER, 'avatars'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'resumes'), exist_ok=True)

# Tech skills list for extraction
TECH_SKILLS = [
    'Python', 'Java', 'C++', 'C#', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Ruby', 'PHP',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Cassandra',
    'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible', 'Jenkins',
    'Git', 'REST API', 'GraphQL', 'Machine Learning', 'TensorFlow', 'PyTorch',
    'Pandas', 'NumPy', 'Scikit-learn', 'Keras', 'OpenCV', 'NLP', 'Spark', 'Hadoop',
    'HTML', 'CSS', 'SASS', 'Bootstrap', 'Microservices', 'System Design', 'Agile'
]

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        full_name TEXT,
        initials TEXT,
        phone TEXT,
        dob TEXT,
        skills_json TEXT,
        avatar_filename TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        extracted_skills_json TEXT,
        prediction TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )''')

    conn.commit()
    conn.close()

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def login_required(f):
    """Decorator to check if user is logged in"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function

def extract_text_from_file(file_path):
    """Extract text from uploaded file"""
    try:
        if file_path.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        elif file_path.endswith('.pdf'):
            try:
                import PyPDF2
                with open(file_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    text = ''
                    for page in reader.pages:
                        text += page.extract_text()
                    return text
            except:
                return ''
    except:
        return ''

def extract_skills(text):
    """Extract tech skills from text using simple matching"""
    text_lower = text.lower()
    found_skills = []

    for skill in TECH_SKILLS:
        if skill.lower() in text_lower:
            found_skills.append(skill)

    # Remove duplicates and return
    return list(set(found_skills))

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==================== ROUTES ====================

@app.route('/')
def home():
    """Home page"""
    return render_template('home.html')

@app.route('/about')
def about():
    """About page with Terms & Conditions"""
    return render_template('about.html')

@app.route('/dashboard')
@login_required
def dashboard():
    """User dashboard"""
    conn = get_db()
    c = conn.cursor()

    # Get user info
    c.execute('SELECT username, email FROM users WHERE id = ?', (session['user_id'],))
    user = c.fetchone()

    # Get profile
    c.execute('SELECT * FROM profiles WHERE user_id = ?', (session['user_id'],))
    profile = c.fetchone()

    conn.close()

    profile_data = {
        'full_name': profile['full_name'] if profile else '',
        'initials': profile['initials'] if profile else '',
        'phone': profile['phone'] if profile else '',
        'dob': profile['dob'] if profile else '',
        'skills': json.loads(profile['skills_json']) if profile and profile['skills_json'] else [],
        'avatar_filename': profile['avatar_filename'] if profile else None
    }

    return render_template('dashboard.html', username=user['username'], profile=profile_data)

@app.route('/resume-analyzer')
def resume_analyzer():
    """Resume analyzer page"""
    return render_template('resume_analyzer.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        # Handle both JSON and form-encoded requests
        if request.is_json:
            email = request.get_json().get('email')
            password = request.get_json().get('password')
        else:
            email = request.form.get('email')
            password = request.form.get('password')

        if not email or not password:
            if request.is_json:
                return jsonify({'success': False, 'error': 'Email and password required'}), 400
            return render_template('home.html', error='Email and password required')

        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT id, password_hash FROM users WHERE email = ?', (email,))
        user = c.fetchone()
        conn.close()

        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session.permanent = True
            if request.is_json:
                return jsonify({'success': True, 'message': 'Login successful'}), 200
            return redirect(url_for('dashboard'))
        else:
            if request.is_json:
                return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
            return render_template('home.html', error='Invalid email or password')

    return redirect(url_for('home'))

@app.route('/signup', methods=['POST'])
def signup():
    """User signup"""
    # Handle both JSON and form-encoded requests
    if request.is_json:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirm_password')
    else:
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')

    # Validation
    if not all([username, email, password, confirm_password]):
        if request.is_json:
            return jsonify({'success': False, 'error': 'All fields required'}), 400
        return render_template('home.html', error='All fields required')

    if password != confirm_password:
        if request.is_json:
            return jsonify({'success': False, 'error': 'Passwords do not match'}), 400
        return render_template('home.html', error='Passwords do not match')

    if len(password) < 6:
        if request.is_json:
            return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400
        return render_template('home.html', error='Password must be at least 6 characters')

    conn = get_db()
    c = conn.cursor()

    try:
        password_hash = generate_password_hash(password)
        c.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            (username, email, password_hash)
        )
        c.execute(
            'INSERT INTO profiles (user_id) VALUES (last_insert_rowid())'
        )
        conn.commit()

        # Get the new user ID and login
        c.execute('SELECT id FROM users WHERE email = ?', (email,))
        user = c.fetchone()
        session['user_id'] = user['id']
        session.permanent = True

        conn.close()

        if request.is_json:
            return jsonify({'success': True, 'message': 'Account created successfully'}), 201
        return redirect(url_for('dashboard'))

    except sqlite3.IntegrityError:
        conn.close()
        if request.is_json:
            return jsonify({'success': False, 'error': 'Email or username already exists'}), 409
        return render_template('home.html', error='Email or username already exists')

@app.route('/logout')
def logout():
    """User logout"""
    session.clear()
    return redirect(url_for('home'))

# ==================== API ENDPOINTS ====================

@app.route('/api/upload-resume', methods=['POST'])
@login_required
def upload_resume():
    """Upload and analyze resume"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Only TXT and PDF files allowed'}), 400

    try:
        # Save file
        filename = secure_filename(f"{session['user_id']}_{datetime.now().timestamp()}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'resumes', filename)
        file.save(filepath)

        # Extract text and skills
        text = extract_text_from_file(filepath)
        skills = extract_skills(text)
        preview = text[:500] if text else "Could not extract text"

        # Determine file type and prepare preview data
        file_extension = os.path.splitext(file.filename)[1].lower()
        resume_url = f'/static/uploads/resumes/{filename}'  # URL to access the file

        # Save to database (include filepath for preview display)
        conn = get_db()
        c = conn.cursor()
        c.execute(
            'INSERT INTO resumes (user_id, file_name, extracted_skills_json) VALUES (?, ?, ?)',
            (session['user_id'], filename, json.dumps(skills))
        )
        conn.commit()
        conn.close()

        # Add notification
        add_notification(session['user_id'], 'Resume uploaded')

        return jsonify({
            'success': True,
            'skills': skills,
            'preview_text': preview,
            'file_type': file_extension,
            'file_name': file.filename,
            'file_url': resume_url,
            'message': f'Extracted {len(skills)} skills from resume'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict-role', methods=['POST'])
@login_required
def predict_role():
    """Predict career role from resume text using ensemble of SVM and Random Forest models.
    GUARANTEED to return ONLY ONE of the 8 required roles:
    1. Full Stack Developer
    2. DevOps Engineer
    3. Data Scientist
    4. Cloud Engineer
    5. AI/ML Engineer
    6. Network Engineer
    7. RF Engineer
    8. Field Engineer
    """
    data = request.get_json()
    text = data.get('text', '')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        # Load models and vectorizer (both SVM and RF for ensemble prediction)
        vectorizer = joblib.load('models/vectorizer.joblib')
        label_encoder = joblib.load('models/label_encoder.joblib')

        # VALIDATION: Ensure label_encoder only has the 8 required roles
        REQUIRED_ROLES = {
            'Full Stack Developer',
            'DevOps Engineer',
            'Data Scientist',
            'Cloud Engineer',
            'AI/ML Engineer',
            'Network Engineer',
            'RF Engineer',
            'Field Engineer'
        }

        encoded_roles = set(label_encoder.classes_)
        if encoded_roles != REQUIRED_ROLES:
            print(f"ERROR: Encoded roles {encoded_roles} do not match required roles {REQUIRED_ROLES}")
            return jsonify({'error': 'Model inconsistency - roles mismatch'}), 500

        # Load both SVM and RandomForest models
        try:
            svm_model = joblib.load('models/svm_model.joblib')
            has_svm = True
        except:
            has_svm = False
            print("Warning: SVM model not found, using RF only")

        try:
            rf_model = joblib.load('models/rf_model.joblib')
            has_rf = True
        except:
            has_rf = False
            print("Warning: RF model not found, using SVM only")

        # Fallback to best_model if both specific models don't exist
        if not has_svm and not has_rf:
            rf_model = joblib.load('models/best_model.joblib')
            has_rf = True

        # Vectorize text using the SAME vectorizer used in training
        X = vectorizer.transform([text])

        # Initialize predictions and confidences
        svm_role = None
        svm_confidence = 0.0
        rf_role = None
        rf_confidence = 0.0

        # SVM prediction (if model available)
        if has_svm:
            svm_prediction_idx = svm_model.predict(X)[0]
            svm_role = label_encoder.inverse_transform([svm_prediction_idx])[0]
            # Validate SVM role is in required set
            if svm_role not in REQUIRED_ROLES:
                print(f"ERROR: SVM returned invalid role: {svm_role}")
                svm_role = None
            # LinearSVC doesn't have predict_proba, use decision_function instead
            try:
                decision_scores = svm_model.decision_function(X)[0]
                # Normalize decision scores to confidence-like metric (0-1 range)
                svm_confidence = float(1.0 / (1.0 + np.exp(-decision_scores[svm_prediction_idx])))
                svm_confidence = max(0.5, min(1.0, svm_confidence))  # Clamp to 0.5-1.0
            except:
                svm_confidence = 0.75  # Default confidence for SVM

        # RandomForest prediction (if model available)
        if has_rf:
            rf_prediction_idx = rf_model.predict(X)[0]
            rf_role = label_encoder.inverse_transform([rf_prediction_idx])[0]
            # Validate RF role is in required set
            if rf_role not in REQUIRED_ROLES:
                print(f"ERROR: RF returned invalid role: {rf_role}")
                rf_role = None
            # RF has predict_proba
            try:
                rf_proba = rf_model.predict_proba(X)[0]
                rf_confidence = float(max(rf_proba))
            except:
                rf_confidence = 0.75  # Default confidence for RF

        # Ensemble prediction: intelligent role selection
        # Use weighted voting with confidence scores
        if has_svm and has_rf and svm_role and rf_role:
            # Both models available: use weighted ensemble
            if svm_role == rf_role:
                # Agreement between models - highest confidence
                final_role = svm_role
                final_confidence = (svm_confidence + rf_confidence) / 2.0
                ensemble_method = "both_agree"
            else:
                # Disagreement: choose the one with higher confidence
                if svm_confidence >= rf_confidence:
                    final_role = svm_role
                    final_confidence = svm_confidence
                    ensemble_method = "svm_higher_confidence"
                else:
                    final_role = rf_role
                    final_confidence = rf_confidence
                    ensemble_method = "rf_higher_confidence"
        elif has_rf and rf_role:
            final_role = rf_role
            final_confidence = rf_confidence
            ensemble_method = "rf_only"
        elif has_svm and svm_role:
            final_role = svm_role
            final_confidence = svm_confidence
            ensemble_method = "svm_only"
        else:
            # Fallback: shouldn't happen, but use first required role as default
            final_role = 'Full Stack Developer'
            final_confidence = 0.5
            ensemble_method = "fallback_error"
            print(f"WARNING: Fallback prediction used")

        # Final validation: ENSURE final_role is in REQUIRED_ROLES
        if final_role not in REQUIRED_ROLES:
            print(f"CRITICAL ERROR: Final role {final_role} is not in required roles set!")
            final_role = 'Full Stack Developer'  # Force to safe default
            final_confidence = 0.5

        # Get top 3 predictions from best-performing model for variety
        top_roles = []
        try:
            if has_rf and hasattr(rf_model, 'predict_proba'):
                probabilities = rf_model.predict_proba(X)[0]
                top_indices = sorted(range(len(probabilities)), key=lambda i: probabilities[i], reverse=True)[:3]
                top_roles = [
                    {
                        'role': label_encoder.inverse_transform([idx])[0],
                        'confidence': float(probabilities[idx])
                    }
                    for idx in top_indices
                    # Only include roles from REQUIRED_ROLES
                    if label_encoder.inverse_transform([idx])[0] in REQUIRED_ROLES
                ]
        except Exception as e:
            print(f"Error getting top roles: {e}")
            pass

        # Fallback if top_roles is empty
        if not top_roles and final_role:
            top_roles = [{'role': final_role, 'confidence': final_confidence}]

        # Determine if prediction is uncertain
        uncertainty_threshold = 0.65
        is_uncertain = final_confidence < uncertainty_threshold
        uncertainty_message = ""
        if is_uncertain:
            uncertainty_message = "Prediction is uncertain. Please improve your resume with more specific skills and achievements."

        # Save prediction to most recent resume
        conn = get_db()
        c = conn.cursor()
        try:
            c.execute(
                'SELECT id FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1',
                (session['user_id'],)
            )
            resume = c.fetchone()

            if resume:
                c.execute(
                    'UPDATE resumes SET prediction = ? WHERE id = ?',
                    (final_role, resume['id'])
                )
                conn.commit()
        except Exception as db_error:
            print(f"Database error saving prediction: {db_error}")
            conn.rollback()
        finally:
            conn.close()

        # Add notification
        add_notification(session['user_id'], f'Career role predicted: {final_role}')

        return jsonify({
            'success': True,
            'predicted_role': final_role,
            'confidence': float(final_confidence),
            'svm_role': svm_role,
            'svm_confidence': float(svm_confidence) if (has_svm and svm_role) else None,
            'rf_role': rf_role,
            'rf_confidence': float(rf_confidence) if (has_rf and rf_role) else None,
            'top_roles': top_roles,
            'ensemble_method': ensemble_method,
            'is_uncertain': is_uncertain,
            'uncertainty_message': uncertainty_message,
            'message': f'Predicted role: {final_role}' + (f' ({uncertainty_message})' if is_uncertain else ''),
            'required_roles_count': len(REQUIRED_ROLES),
            'validation_passed': final_role in REQUIRED_ROLES
        })

    except Exception as e:
        print(f"Prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/api/profile', methods=['GET', 'POST'])
@login_required
def profile():
    """Get or update user profile"""
    if request.method == 'GET':
        conn = get_db()
        c = conn.cursor()

        # Get user info
        c.execute('SELECT username, email FROM users WHERE id = ?', (session['user_id'],))
        user = c.fetchone()

        # Get profile
        c.execute('SELECT * FROM profiles WHERE user_id = ?', (session['user_id'],))
        profile = c.fetchone()
        conn.close()

        if not profile:
            return jsonify({'error': 'Profile not found'}), 404

        return jsonify({
            'username': user['username'] if user else '',
            'email': user['email'] if user else '',
            'full_name': profile['full_name'] or '',
            'initials': profile['initials'] or '',
            'phone': profile['phone'] or '',
            'dob': profile['dob'] or '',
            'skills': json.loads(profile['skills_json']) if profile['skills_json'] else [],
            'avatar_filename': profile['avatar_filename']
        })

    elif request.method == 'POST':
        data = request.get_json()

        # Limit skills to 5
        skills = data.get('skills', [])[:5]

        conn = get_db()
        c = conn.cursor()
        c.execute(
            '''UPDATE profiles SET full_name = ?, initials = ?, phone = ?, dob = ?, skills_json = ?
               WHERE user_id = ?''',
            (data.get('full_name'), data.get('initials'), data.get('phone'),
             data.get('dob'), json.dumps(skills), session['user_id'])
        )
        conn.commit()
        conn.close()

        # Add notification
        add_notification(session['user_id'], 'Profile updated')

        return jsonify({'success': True, 'message': 'Profile updated'})

@app.route('/api/avatar', methods=['POST'])
@login_required
def upload_avatar():
    """Upload user avatar"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Check file extension
    allowed_exts = {'jpg', 'jpeg', 'png', 'webp'}
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''

    if ext not in allowed_exts:
        return jsonify({'error': 'Only JPG, PNG, and WebP allowed'}), 400

    try:
        # Save avatar
        filename = secure_filename(f"avatar_{session['user_id']}_{datetime.now().timestamp()}.{ext}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'avatars', filename)
        file.save(filepath)

        # Update profile
        conn = get_db()
        c = conn.cursor()
        c.execute('UPDATE profiles SET avatar_filename = ? WHERE user_id = ?',
                  (filename, session['user_id']))
        conn.commit()
        conn.close()

        url = f'/static/uploads/avatars/{filename}'
        return jsonify({'success': True, 'url': url, 'filename': filename})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/notifications', methods=['GET'])
@login_required
def notifications():
    """Get user notifications"""
    conn = get_db()
    c = conn.cursor()
    c.execute(
        'SELECT id, message, created_at, is_read FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
        (session['user_id'],)
    )
    notifs = c.fetchall()
    conn.close()

    return jsonify({
        'notifications': [
            {'id': n['id'], 'message': n['message'], 'created_at': n['created_at'], 'is_read': n['is_read']}
            for n in notifs
        ]
    })

@app.route('/api/job-fit-analysis', methods=['POST'])
@login_required
def job_fit_analysis():
    """Analyze fit for a specific job role"""
    data = request.get_json()
    job_role = data.get('job_role', '').lower().strip()
    skills = data.get('skills', '')
    resume_text = data.get('resume_text', '')

    if not job_role or not skills:
        return jsonify({'error': 'Job role and skills required'}), 400

    try:
        # Load models
        vectorizer = joblib.load('models/vectorizer.joblib')
        model = joblib.load('models/best_model.joblib')
        label_encoder = joblib.load('models/label_encoder.joblib')

        # Vectorize the skills text
        X = vectorizer.transform([skills])

        # Get prediction probabilities
        try:
            probabilities = model.predict_proba(X)[0]
            all_roles = label_encoder.classes_

            # Find the target job role in available roles
            fit_score = 0.0
            target_idx = None
            for idx, role in enumerate(all_roles):
                if job_role.lower() in role.lower() or role.lower() in job_role.lower():
                    fit_score = float(probabilities[idx])
                    target_idx = idx
                    break

            # If exact match not found, use closest match or default
            if target_idx is None:
                fit_score = 0.65  # Default for roles not in training data
        except:
            fit_score = 0.70

        # Determine skills match quality
        user_skills_set = set(skill.lower().strip() for skill in skills.split(','))
        tech_skills_lower = set(skill.lower() for skill in TECH_SKILLS)
        matching_skills = user_skills_set & tech_skills_lower

        if len(matching_skills) >= 5:
            skills_match = 'Excellent'
        elif len(matching_skills) >= 3:
            skills_match = 'Good'
        elif len(matching_skills) >= 1:
            skills_match = 'Fair'
        else:
            skills_match = 'Limited'

        # Determine experience level based on skills count
        if len(user_skills_set) >= 8:
            experience_level = 'Senior'
        elif len(user_skills_set) >= 5:
            experience_level = 'Intermediate'
        else:
            experience_level = 'Junior'

        return jsonify({
            'success': True,
            'job_role': job_role.title(),
            'fit_score': fit_score,
            'skills_match': skills_match,
            'experience_level': experience_level,
            'message': f'Analysis complete for {job_role.title()}'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def add_notification(user_id, message):
    """Add notification for user"""
    conn = get_db()
    c = conn.cursor()
    c.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)', (user_id, message))
    conn.commit()
    conn.close()

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return render_template('home.html'), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
