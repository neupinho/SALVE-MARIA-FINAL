from flask import Flask, render_template, request, jsonify, abort
from models import db, Report, Comment

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
            description=data.get("description")
        )
        db.session.add(new_report)
        db.session.commit()
        return jsonify({"message": "Report saved!", "id": new_report.id}), 201

    @app.route("/api/reports", methods=["GET"])
    def get_reports():
        reports = Report.query.all()
        return jsonify([
            {
                "id": r.id,
                "lat": r.lat,
                "lng": r.lng,
                "address": r.address,
                "type": r.occurrence_type,
                "level": r.danger_level,
                "description": r.description
            } for r in reports
        ])

    @app.route("/api/reports/<int:report_id>", methods=["PUT"])
    def update_report(report_id):
        data = request.get_json()
        report = db.session.get(Report, report_id)
        if not report:
            abort(404, description="Report not found")
        report.lat             = data.get("lat", report.lat)
        report.lng             = data.get("lng", report.lng)
        report.address         = data.get("address", report.address)
        report.occurrence_type = data.get("type", report.occurrence_type)
        report.danger_level    = data.get("level", report.danger_level)
        report.description     = data.get("description", report.description)
        db.session.commit()
        return jsonify({"message": "Report updated!"})

    @app.route("/api/reports/<int:report_id>", methods=["DELETE"])
    def delete_report(report_id):
        report = db.session.get(Report, report_id)
        if not report:
            abort(404, description="Report not found")
        db.session.delete(report)
        db.session.commit()
        return jsonify({"message": "Report deleted!"})

    @app.route("/api/reports/<int:report_id>/comments", methods=["POST"])
    def add_comment(report_id):
        report = db.session.get(Report, report_id)
        if not report:
            abort(404, description="Report not found")
        data = request.get_json()
        comment = Comment(
            author=data.get("author", "Anônimo"),
            content=data["content"],
            report=report
        )
        db.session.add(comment)
        db.session.commit()
        return jsonify({"message": "Comment added!", "id": comment.id}), 201

    @app.route("/api/reports/<int:report_id>/comments", methods=["GET"])
    def get_comments(report_id):
        report = db.session.get(Report, report_id)
        if not report:
            abort(404, description="Report not found")
        return jsonify([
            {
                "id": c.id,
                "author": c.author,
                "content": c.content,
                "timestamp": c.timestamp.isoformat()
            } for c in report.comments
        ])

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
