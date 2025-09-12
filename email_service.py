"""
Email service module for sending notifications using SendGrid
"""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("FROM_EMAIL", "jules.balanche@erythosia.com")
        self.frontend_url = os.getenv("FRONTEND_URL", "https://r-d-agent-frontend.vercel.app")
        
        if not self.api_key:
            logger.warning("SENDGRID_API_KEY not configured - email notifications disabled")
            self.client = None
        else:
            self.client = SendGridAPIClient(api_key=self.api_key)
    
    def send_collaborator_invitation(
        self, 
        invitee_email: str, 
        inviter_name: str,
        inviter_email: str,
        project_name: str, 
        project_id: str, 
        role: str
    ) -> bool:
        """Send collaborator invitation email"""
        if not self.client:
            logger.warning("SendGrid not configured - skipping email notification")
            print(f"SendGrid config - API Key: {'SET' if self.api_key else 'NOT_SET'}, From Email: {self.from_email}")
            return False
        
        try:
            # Create email content
            subject = f"You've been invited to collaborate on \"{project_name}\""
            
            html_content = self._get_invitation_html_template(
                inviter_name=inviter_name,
                inviter_email=inviter_email,
                project_name=project_name,
                project_id=project_id,
                role=role.title()
            )
            
            plain_content = self._get_invitation_text_template(
                inviter_name=inviter_name,
                inviter_email=inviter_email,
                project_name=project_name,
                project_id=project_id,
                role=role.title()
            )
            
            # Create and send email
            message = Mail(
                from_email=self.from_email,
                to_emails=invitee_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=plain_content
            )
            
            response = self.client.send(message)
            
            if response.status_code == 202:
                logger.info(f"Invitation email sent successfully to {invitee_email}")
                return True
            else:
                logger.error(f"Failed to send email: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error sending invitation email: {str(e)}")
            print(f"SendGrid error details: {e}")  # Add console logging for debugging
            return False
    
    def _get_invitation_html_template(
        self, 
        inviter_name: str,
        inviter_email: str, 
        project_name: str, 
        project_id: str, 
        role: str
    ) -> str:
        """HTML email template for collaborator invitation"""
        project_url = f"{self.frontend_url}/project/{project_id}"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Project Collaboration Invitation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🔬 R&D Agent</h1>
                <p style="color: #f0f0f0; margin: 10px 0 0 0;">Research Collaboration Platform</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                <h2 style="color: #333; margin-top: 0;">You've been invited to collaborate!</h2>
                
                <p>Hi there!</p>
                
                <p><strong>{inviter_name}</strong> ({inviter_email}) has invited you to collaborate on their research project as a <strong>{role}</strong>.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #667eea;">📋 Project Details</h3>
                    <p><strong>Project:</strong> {project_name}</p>
                    <p><strong>Your Role:</strong> {role}</p>
                    <p><strong>Invited by:</strong> {inviter_name}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{project_url}" 
                       style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        🚀 Access Project
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                    If you don't have an account yet, you'll be prompted to create one using this email address.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #888; text-align: center;">
                    This invitation was sent by the R&D Agent platform.<br>
                    If you believe this was sent in error, please ignore this email.
                </p>
            </div>
        </body>
        </html>
        """
    
    def _get_invitation_text_template(
        self, 
        inviter_name: str,
        inviter_email: str, 
        project_name: str, 
        project_id: str, 
        role: str
    ) -> str:
        """Plain text email template for collaborator invitation"""
        project_url = f"{self.frontend_url}/project/{project_id}"
        
        return f"""
R&D Agent - Research Collaboration Platform

You've been invited to collaborate!

Hi there!

{inviter_name} ({inviter_email}) has invited you to collaborate on their research project as a {role}.

Project Details:
- Project: {project_name}
- Your Role: {role}
- Invited by: {inviter_name}

Access your project here:
{project_url}

If you don't have an account yet, you'll be prompted to create one using this email address.

Best regards,
The R&D Agent Team

---
This invitation was sent by the R&D Agent platform.
If you believe this was sent in error, please ignore this email.
        """

# Global email service instance
email_service = EmailService()
