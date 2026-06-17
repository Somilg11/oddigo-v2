export class EmailTemplates {

    static otpVerification(name: string, otp: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #f9f9f9; border-radius: 10px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .otp-box { background: #fff; border: 2px dashed #007bff; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Oddigo - OTP Verification</h1>
        </div>
        <p>Hello ${name},</p>
        <p>Your One-Time Password (OTP) for login is:</p>
        <div class="otp-box">
            <div class="otp">${otp}</div>
        </div>
        <p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>
        <div class="footer">
            <p>If you didn't request this, please ignore this email.</p>
            <p>&copy; ${new Date().getFullYear()} Oddigo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
    }

    static jobConfirmation(name: string, serviceType: string, estimatedPrice: number): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #f9f9f9; border-radius: 10px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .details { background: #fff; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .label { color: #666; font-size: 14px; }
        .value { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Job Confirmed!</h1>
        </div>
        <p>Hello ${name},</p>
        <p>Your service request has been confirmed.</p>
        <div class="details">
            <div class="label">Service</div>
            <div class="value">${serviceType}</div>
            <div class="label">Estimated Price</div>
            <div class="value">₹${estimatedPrice}</div>
        </div>
        <p>A worker will be assigned shortly. You will receive updates in real-time.</p>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Oddigo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
    }

    static warrantyIssued(name: string, jobServiceType: string, warrantyDays: number): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #f9f9f9; border-radius: 10px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .warranty-box { background: #d4edda; border: 1px solid #28a745; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Warranty Issued</h1>
        </div>
        <p>Hello ${name},</p>
        <p>Your service has been completed and a warranty has been issued.</p>
        <div class="warranty-box">
            <h3>${warrantyDays}-Day Warranty</h3>
            <p>Service: ${jobServiceType}</p>
        </div>
        <p>If you face any issues within the warranty period, you can file a claim from the app.</p>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Oddigo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
    }

    static workerPayout(name: string, amount: number, jobCount: number): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .container { background: #f9f9f9; border-radius: 10px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .payout-box { background: #fff; border: 2px solid #28a745; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #28a745; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payout Processed</h1>
        </div>
        <p>Hello ${name},</p>
        <p>Your payout has been processed.</p>
        <div class="payout-box">
            <div class="amount">₹${amount}</div>
            <p>For ${jobCount} completed job(s)</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Oddigo. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
    }
}
