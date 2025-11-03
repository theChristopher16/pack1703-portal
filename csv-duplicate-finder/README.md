# CSV Duplicate Finder

A simple Flask web application that identifies and downloads duplicate rows from CSV files.

## Features

- **Upload CSV files** up to 16MB
- **Identify duplicates** across all columns
- **View results** in an interactive web interface
- **Download duplicates** as a separate CSV file

## Installation

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Start the Flask application:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Upload a CSV file using the web interface

4. View the results showing:
   - Original data in a scrollable table
   - Duplicate rows (if any) in a separate table
   - Download button to get duplicates as a CSV file

## How It Works

The application uses `pandas.DataFrame.duplicated(keep=False)` to identify all occurrences of duplicate rows across all columns. The duplicate data is temporarily stored in Flask's session and can be downloaded as a CSV file.

### Technical Details

- **Framework**: Flask 3.0.0
- **Data Processing**: Pandas 2.1.4
- **Session Storage**: Flask sessions for temporary duplicate storage
- **File Upload**: Multipart form data with size limit enforcement
- **CSV Download**: In-memory file generation using BytesIO

## Security Notes

⚠️ **Important**: Before deploying to production:
- Change the `app.secret_key` in `app.py` to a secure random value
- Consider using environment variables for configuration
- Implement proper authentication if needed
- Review and adjust file size limits
- Add CSRF protection for forms

## File Structure

```
csv-duplicate-finder/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   ├── index.html        # Upload page
│   └── results.html      # Results display page
└── uploads/              # Temporary upload directory (auto-created)
```

## License

This project is open source and available under the MIT License.

