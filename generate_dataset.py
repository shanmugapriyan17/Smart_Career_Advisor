import pandas as pd
import numpy as np
import random

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

# Define comprehensive job roles and related data
roles = [
    'Software Engineer', 'Data Scientist', 'Data Engineer', 'Machine Learning Engineer',
    'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer',
    'Cloud Architect', 'Security Engineer', 'Network Engineer', 'Systems Administrator',
    'Database Administrator', 'QA Engineer', 'Product Manager', 'Project Manager',
    'Business Analyst', 'UI/UX Designer', 'Graphic Designer', 'Solutions Architect',
    'Technical Lead', 'Engineering Manager', 'Systems Engineer', 'Site Reliability Engineer',
    'Platform Engineer', 'Infrastructure Engineer', 'API Developer', 'Mobile Developer',
    'iOS Developer', 'Android Developer', 'Game Developer', 'Web Developer',
    'Technical Writer', 'DevSecOps Engineer', 'Data Analyst', 'BI Developer',
    'Research Engineer', 'NLP Engineer', 'Computer Vision Engineer', 'Robotics Engineer',
    'Embedded Systems Engineer', 'Firmware Engineer', 'FPGA Engineer', 'Hardware Engineer'
]

# Skill pools for each category
tech_skills = [
    'Python', 'Java', 'C++', 'C#', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Ruby', 'PHP',
    'SQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB',
    'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'Ansible', 'Jenkins',
    'Git', 'GitHub', 'GitLab', 'BitBucket', 'CI/CD', 'REST API', 'GraphQL', 'gRPC',
    'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas',
    'NumPy', 'Matplotlib', 'Keras', 'OpenCV', 'NLP', 'Computer Vision', 'Apache Spark',
    'Hadoop', 'Hive', 'HBase', 'Kafka', 'RabbitMQ', 'Apache Storm', 'Flink',
    'Microservices', 'System Design', 'Database Design', 'Performance Optimization',
    'Agile', 'Scrum', 'Linux', 'Windows Server', 'Unix', 'Shell Scripting', 'Bash',
    'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind', 'Material Design', 'Figma',
    'AWS EC2', 'AWS S3', 'AWS Lambda', 'AWS RDS', 'Azure VMs', 'Azure SQL', 'GCP Compute',
    'OAuth', 'JWT', 'SSO', 'LDAP', 'SSL/TLS', 'Encryption', 'Hashing', 'Authentication',
    'Unit Testing', 'Integration Testing', 'E2E Testing', 'Jest', 'JUnit', 'Pytest',
    'Selenium', 'Cypress', 'Load Testing', 'Performance Testing', 'Security Testing'
]

soft_skills = [
    'Communication', 'Leadership', 'Problem Solving', 'Team Work', 'Collaboration',
    'Project Management', 'Critical Thinking', 'Analytical Skills', 'Attention to Detail',
    'Time Management', 'Adaptability', 'Creativity', 'Decision Making', 'Negotiation',
    'Mentoring', 'Training', 'Documentation', 'Presentation Skills', 'Interpersonal Skills',
    'Conflict Resolution', 'Customer Focus', 'Innovation', 'Strategic Planning'
]

# Job descriptions template fragments
description_fragments = [
    'developing scalable solutions', 'building robust systems', 'improving performance',
    'leading technical initiatives', 'mentoring team members', 'designing architecture',
    'implementing best practices', 'ensuring code quality', 'managing databases',
    'optimizing queries', 'securing applications', 'deploying infrastructure',
    'containerizing services', 'orchestrating clusters', 'automating workflows',
    'implementing CI/CD', 'creating dashboards', 'analyzing data', 'building models',
    'training algorithms', 'deploying models', 'monitoring systems', 'debugging issues',
    'troubleshooting problems', 'supporting users', 'documenting code', 'reviewing code',
    'designing APIs', 'testing applications', 'managing configurations', 'scaling systems',
    'integrating services', 'migrating systems', 'refactoring code'
]

print("Generating 50,000 job records...")

data = []
for i in range(50000):
    if i % 5000 == 0:
        print(f"Progress: {i}/50000")

    role = random.choice(roles)

    # Generate 5-15 random skills for each record
    num_skills = random.randint(5, 15)
    selected_skills = random.sample(tech_skills, num_skills)

    # Randomly add soft skills (0-3)
    if random.random() > 0.5:
        selected_skills.extend(random.sample(soft_skills, random.randint(1, 3)))

    skills = ', '.join(selected_skills)

    # Generate job description
    num_fragments = random.randint(4, 8)
    fragments = random.sample(description_fragments, num_fragments)
    job_description = f"We are looking for a {role} to help us with {', '.join(fragments)}. "
    job_description += f"Required skills: {', '.join(random.sample(selected_skills, min(5, len(selected_skills))))}. "
    job_description += "Join our team and make an impact!"

    data.append({
        'role': role,
        'skills': skills,
        'job_description': job_description
    })

# Create DataFrame
df = pd.DataFrame(data)

# Save to CSV
output_path = 'E:/R PROJECT/new/SCA/data/jobs_dataset.csv'
df.to_csv(output_path, index=False)

print(f"\nDataset created successfully!")
print(f"Total records: {len(df)}")
print(f"Unique roles: {df['role'].nunique()}")
print(f"Saved to: {output_path}")
print(f"\nFirst few records:")
print(df.head())
print(f"\nDataset info:")
print(df.info())
print(f"\nRole distribution:")
print(df['role'].value_counts())
