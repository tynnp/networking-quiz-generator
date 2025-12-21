import smtplib
import random
import string
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

def generate_otp(length: int = 6) -> str:
    """Generate a random OTP code with specified length."""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(to_email: str, user_name: str, otp: str) -> bool:
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("SMTP credentials not configured")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Mã xác nhận đăng ký - Hệ thống Trắc nghiệm Mạng Máy Tính"
        message["From"] = f"Hệ thống Trắc nghiệm <{SMTP_EMAIL}>"
        message["To"] = to_email

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.8;
                font-size: 18px;
                color: #2d3748;
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
            }}
            .container {{
                padding-top: 10px;
            }}
            .otp-code {{
                font-size: 36px;
                font-weight: 800;
                color: #124874;
                letter-spacing: 4px;
                margin: 30px 0;
                text-align: left;
            }}
            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #edf2f7;
                font-size: 12px;
                color: #a0aec0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <p>Xin chào <strong>{user_name}</strong>,</p>
            <p>Mã xác nhận để đăng ký tài khoản tại Hệ thống Trắc nghiệm Mạng Máy Tính của bạn là:</p>
            <div class="otp-code">{otp}</div>
            <p>Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
            <p>© 2025 Nhóm đồ án Trí tuệ nhân tạo của Nguyễn Ngọc Phú Tỷ</p>
        </div>
    </body>
    </html>
    """
        
        text_content = f"""
        Xin chào {user_name},
        
        Bạn đã yêu cầu đăng ký tài khoản tại Hệ thống Trắc nghiệm Mạng Máy Tính.
        
        Mã xác nhận của bạn là: {otp}
        
        Mã này sẽ hết hạn sau 5 phút.
        Vui lòng không chia sẻ mã này với bất kỳ ai.
        
        Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.
        
        ---
        © 2025 Nhóm đồ án Trí tuệ nhân tạo của Nguyễn Ngọc Phú Tỷ
        """
        
        part1 = MIMEText(text_content, "plain", "utf-8")
        part2 = MIMEText(html_content, "html", "utf-8")
        message.attach(part1)
        message.attach(part2)
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, message.as_string())
        
        print(f"OTP email sent successfully to {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"SMTP Authentication Error: {e}")
        return False
    except smtplib.SMTPException as e:
        print(f"SMTP Error: {e}")
        return False
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def send_reset_password_otp_email(to_email: str, user_name: str, otp: str) -> bool:
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("SMTP credentials not configured")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Mã xác nhận khôi phục mật khẩu - Hệ thống Trắc nghiệm Mạng Máy Tính"
        message["From"] = f"Hệ thống Trắc nghiệm <{SMTP_EMAIL}>"
        message["To"] = to_email

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                line-height: 1.8;
                font-size: 18px;
                color: #2d3748;
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
            }}
            .container {{
                padding-top: 10px;
            }}
            .otp-code {{
                font-size: 36px;
                font-weight: 800;
                color: #e53e3e;
                letter-spacing: 4px;
                margin: 30px 0;
                text-align: left;
            }}
            .footer {{
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #edf2f7;
                font-size: 12px;
                color: #a0aec0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <p>Xin chào <strong>{user_name}</strong>,</p>
            <p>Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn tại Hệ thống Trắc nghiệm Mạng Máy Tính.</p>
            <p>Mã xác nhận khôi phục mật khẩu của bạn là:</p>
            <div class="otp-code">{otp}</div>
            <p>Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
            <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
            <p>© 2025 Nhóm đồ án Trí tuệ nhân tạo của Nguyễn Ngọc Phú Tỷ</p>
        </div>
    </body>
    </html>
    """
        
        text_content = f"""
        Xin chào {user_name},
        
        Bạn đã yêu cầu khôi phục mật khẩu tại Hệ thống Trắc nghiệm Mạng Máy Tính.
        
        Mã xác nhận của bạn là: {otp}
        
        Mã này sẽ hết hạn sau 5 phút.
        Vui lòng không chia sẻ mã này với bất kỳ ai.
        
        Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này.
        
        ---
        © 2025 Nhóm đồ án Trí tuệ nhân tạo của Nguyễn Ngọc Phú Tỷ
        """
        
        part1 = MIMEText(text_content, "plain", "utf-8")
        part2 = MIMEText(html_content, "html", "utf-8")
        message.attach(part1)
        message.attach(part2)
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, message.as_string())
        
        print(f"Reset password OTP email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"Error sending reset password email: {e}")
        return False
