from flask import Flask, render_template, request, send_file, session
import pandas as pd
import os
from io import BytesIO
import json

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'  # Required for sessions
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return "No file part", 400
    file = request.files['file']
    if file.filename == '':
        return "No selected file", 400
    if file:
        try:
            # Read the CSV file
            df = pd.read_csv(file)
            
            # Identify duplicates across all columns
            # keep=False marks all duplicates (including first occurrence) as True
            duplicates = df[df.duplicated(keep=False)]
            
            # Store duplicates in session as JSON for later download
            if not duplicates.empty:
                # Convert DataFrame to JSON string and store in session
                session['duplicates'] = duplicates.to_json(orient='split')
                session['has_duplicates'] = True
            else:
                session['has_duplicates'] = False
                session.pop('duplicates', None)  # Remove if exists
            
            # Render results page
            return render_template('results.html',
                                   original_data=df.to_html(classes='table table-striped', index=False),
                                   duplicate_data=duplicates.to_html(classes='table table-striped', index=False) if not duplicates.empty else None,
                                   has_duplicates=not duplicates.empty)
        except Exception as e:
            return f"Error processing file: {str(e)}", 500
    return "Something went wrong", 500

@app.route('/download_duplicates', methods=['GET'])
def download_duplicates():
    """
    Download the duplicate rows as a CSV file.
    Retrieves the duplicates DataFrame from the session and sends it as a downloadable CSV.
    """
    try:
        # Check if duplicates exist in session
        if 'duplicates' not in session or not session.get('has_duplicates', False):
            return "No duplicates available for download. Please upload a CSV file first.", 400
        
        # Retrieve duplicates from session and convert back to DataFrame
        duplicates_json = session['duplicates']
        duplicates_df = pd.read_json(duplicates_json, orient='split')
        
        # Convert DataFrame to CSV in memory
        output = BytesIO()
        duplicates_df.to_csv(output, index=False, encoding='utf-8')
        output.seek(0)  # Reset pointer to beginning of file
        
        # Send file for download
        return send_file(
            output,
            mimetype='text/csv',
            as_attachment=True,
            download_name='duplicates.csv'
        )
    except Exception as e:
        return f"Error generating download: {str(e)}", 500

if __name__ == '__main__':
    app.run(debug=True)

