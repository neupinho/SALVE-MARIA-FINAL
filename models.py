from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()

class Report(db.Model):
    __tablename__ = 'reports'
    id              = db.Column(db.Integer, primary_key=True)
    lat             = db.Column(db.Float,   nullable=False)
    lng             = db.Column(db.Float,   nullable=False)
    address         = db.Column(db.String(200), nullable=False)
    occurrence_type = db.Column(db.String(50),  nullable=False)
    danger_level    = db.Column(db.String(20),  nullable=False)
    description     = db.Column(db.Text)
    
    comments        = db.relationship('Comment', back_populates='report', cascade='all, delete-orphan')

class Comment(db.Model):
    __tablename__ = 'comments'
    id        = db.Column(db.Integer, primary_key=True)
    author    = db.Column(db.String(80), nullable=False)
    content   = db.Column(db.Text,      nullable=False)
    timestamp = db.Column(db.DateTime,  server_default=db.func.now())
    report_id = db.Column(db.Integer, db.ForeignKey('reports.id'), nullable=False)
    report    = db.relationship('Report', back_populates='comments')