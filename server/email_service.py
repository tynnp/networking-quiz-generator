# Copyright 2025 Nguyễn Ngọc Phú Tỷ
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import smtplib
import random
import string
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from email_validator import validate_email, EmailNotValidError

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

def get_smtp_credentials():
    """Lấy thông tin SMTP từ biến môi trường."""
    return os.getenv("SMTP_EMAIL", ""), os.getenv("SMTP_PASSWORD", "")

def validate_email_address(email: str) -> tuple[bool, str]:
    """Validate email address syntax and DNS MX record."""
    try:
        email_info = validate_email(email, check_deliverability=True)
        return True, ""
    except EmailNotValidError as e:
        error_msg = str(e)
        if "dns" in error_msg.lower() or "deliverability" in error_msg.lower():
            return False, "Tên miền email không tồn tại hoặc không thể nhận email"
        elif "syntax" in error_msg.lower() or "not valid" in error_msg.lower():
            return False, "Địa chỉ email không đúng cú pháp"
        else:
            return False, "Email không hợp lệ"

def generate_otp(length: int = 6) -> str:
    """Generate a random OTP code with specified length."""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(to_email: str, user_name: str, otp: str) -> bool:
    smtp_email, smtp_password = get_smtp_credentials()
    if not smtp_email or not smtp_password:
        print("Chưa cấu hình thông tin SMTP")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Mã xác nhận đăng ký - Hệ thống Trắc nghiệm Mạng Máy Tính"
        message["From"] = f"Hệ thống Trắc nghiệm <{smtp_email}>"
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
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, message.as_string())
        
        print(f"Đã gửi email OTP thành công đến {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"Lỗi xác thực SMTP: {e}")
        return False
    except smtplib.SMTPException as e:
        print(f"Lỗi SMTP: {e}")
        return False
    except Exception as e:
        print(f"Lỗi gửi email: {e}")
        return False

def send_reset_password_otp_email(to_email: str, user_name: str, otp: str) -> bool:
    smtp_email, smtp_password = get_smtp_credentials()
    if not smtp_email or not smtp_password:
        print("Chưa cấu hình thông tin SMTP")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Mã xác nhận khôi phục mật khẩu - Hệ thống Trắc nghiệm Mạng Máy Tính"
        message["From"] = f"Hệ thống Trắc nghiệm <{smtp_email}>"
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
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, message.as_string())
        
        print(f"Đã gửi email OTP khôi phục mật khẩu đến {to_email}")
        return True
        
    except Exception as e:
        print(f"Lỗi gửi email khôi phục mật khẩu: {e}")
        return False

def send_password_changed_email(to_email: str, user_name: str) -> bool:
    """Gửi email thông báo mật khẩu đã được thay đổi."""
    smtp_email, smtp_password = get_smtp_credentials()
    if not smtp_email or not smtp_password:
        print("Chưa cấu hình thông tin SMTP")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = "Thông báo đổi mật khẩu - Hệ thống Trắc nghiệm Mạng Máy Tính"
        message["From"] = f"Hệ thống Trắc nghiệm <{smtp_email}>"
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
            .warning {{
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <p>Xin chào <strong>{user_name}</strong>,</p>
            <p>Mật khẩu tài khoản của bạn tại Hệ thống Trắc nghiệm Mạng Máy Tính đã được thay đổi thành công.</p>
            <div class="warning">
                <strong>Lưu ý:</strong> Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ quản trị viên ngay lập tức.
            </div>
            <p>© 2025 Nhóm đồ án Trí tuệ nhân tạo của Nguyễn Ngọc Phú Tỷ</p>
        </div>
    </body>
    </html>
    """
        
        text_content = f"""
        Xin chào {user_name},
        
        Mật khẩu tài khoản của bạn tại Hệ thống Trắc nghiệm Mạng Máy Tính đã được thay đổi thành công.
        
        Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ quản trị viên ngay lập tức.
        
        ---
        © 2025 Nhóm đồ án Trí tuệ nhân tạo của Nguyễn Ngọc Phú Tỷ
        """
        
        part1 = MIMEText(text_content, "plain", "utf-8")
        part2 = MIMEText(html_content, "html", "utf-8")
        message.attach(part1)
        message.attach(part2)
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(smtp_email, smtp_password)
            server.sendmail(smtp_email, to_email, message.as_string())
        
        print(f"Đã gửi email thông báo đổi mật khẩu đến {to_email}")
        return True
        
    except Exception as e:
        print(f"Lỗi gửi email thông báo đổi mật khẩu: {e}")
        return False
