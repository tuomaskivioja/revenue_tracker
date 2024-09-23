from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS  # Import Flask-CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Function to dynamically create a new table for each customer (username)
def create_table_for_user(username):
    conn = sqlite3.connect('sales.db')
    c = conn.cursor()

    # Dynamically create a table based on the username, tracking only sales
    table_name = f'sales_{username}'  # Ensure the table name is unique to the user
    c.execute(f'''
        CREATE TABLE IF NOT EXISTS {table_name} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_clicked TEXT NOT NULL,
            sale_count INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

# Function to increment sales for a specific video in a user's table
def increment_sale(username, video_clicked):
    conn = sqlite3.connect('sales.db')
    c = conn.cursor()

    # Get the user's specific table name
    table_name = f'sales_{username}'

    # Check if the video already exists in the user's table
    c.execute(f'SELECT sale_count FROM {table_name} WHERE video_clicked = ?', (video_clicked,))
    row = c.fetchone()

    if row:
        # If the video exists, increment the sale count
        new_count = row[0] + 1
        c.execute(f'UPDATE {table_name} SET sale_count = ? WHERE video_clicked = ?', (new_count, video_clicked))
    else:
        # If the video doesn't exist, insert it with a sale count of 1
        c.execute(f'INSERT INTO {table_name} (video_clicked, sale_count) VALUES (?, ?)', (video_clicked, 1))

    conn.commit()
    conn.close()

# View all sales data for a specific user (for testing/debugging purposes)
@app.route('/api/sales/<username>', methods=['GET'])
def get_sales(username):
    conn = sqlite3.connect('sales.db')
    c = conn.cursor()

    # Get the user's specific table name
    table_name = f'sales_{username}'

    try:
        c.execute(f'SELECT video_clicked, sale_count FROM {table_name}')
        sales = c.fetchall()
    except sqlite3.OperationalError as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

    return jsonify(sales)

# Endpoint to handle payment notifications (sales)
@app.route('/api/purchase/<username>', methods=['POST'])
def handle_purchase(username):
    data = request.get_json()

    if not data or 'videoClicked' not in data:
        return jsonify({'error': 'Invalid data: "videoClicked" is required'}), 400

    video_clicked = data['videoClicked']

    try:
        # Ensure the table for the user exists
        create_table_for_user(username)

        # Increment sale for the video clicked in the user's table
        increment_sale(username, video_clicked)
        return jsonify({'message': f'Sale recorded for video: {video_clicked} in table {username}'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)