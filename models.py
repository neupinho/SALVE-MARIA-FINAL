from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(200), nullable=False)
    occurrence_type = db.Column(db.String(50), nullable=False)
    danger_level = db.Column(db.String(20), nullable=False)
    description = db.Column(db.Text)