from flask import Flask, render_template, request, jsonify
from models import db, Report

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)

    with app.app_context():
        db.create_all()

    @app.route("/")
    def index():
        return render_template("index.html")
    
    @app.route("/informacoes")
    def informacoes():
        return render_template("informacoes.html")
    
    @app.route("/abrigos")
    def abrigos():
        return render_template("abrigos.html")
    
    @app.route("/api/reports", methods=["POST"])
    def save_report():
        data = request.get_json()
        new_report = Report(
            lat=data["lat"],
            lng=data["lng"],
            address=data.get("address", "Local clicado"),
            occurrence_type=data["type"],
            danger_level=data["level"],
            description=data["description"]
        )
        db.session.add(new_report)
        db.session.commit()
        return jsonify({"message": "Report saved!"}), 201
    
    @app.route("/api/reports", methods=["GET"])
    def get_reports():
        reports = Report.query.all()
        return jsonify([{
            "id": r.id,
            "lat": r.lat,
            "lng": r.lng,
            "address": r.address,
            "type": r.occurrence_type,
            "level": r.danger_level,
            "description": r.description
        } for r in reports])
    
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)