function generateEmailTemplate(name, email, otp) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify Your Email</title>
        <style>
          /* Basic resets */
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            font-family: Arial, sans-serif;
            background-color: #f6f6f6;
          }

          /* Container setup */
          .container {
            max-width: 600px;
            width: 100%;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          /* Header setup */
          .header {
            text-align: center;
          }

          .header img {
            width: 100%;
            height: auto;
          }

          /* Title Section */
          .title {
            position: relative;
            padding: 40px 20px;
            color: #ffffff;
            text-align: center;
            background: url('https://travmigoz-assethosting.s3.ap-south-1.amazonaws.com/otpEmailAssets/image.png') no-repeat center center;
            background-size: cover;
          }

          .header h1 {
            padding-top: 20px;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
            padding-bottom: 10px; /* Padding below the heading */
            line-height: 1.2; /* Space between lines */
            background-color: #8dd3bb;
            color: white;
          }

          .title p {
            margin: 0;
            text-align: center;
            font-size: 20px;
            line-height: 1.2;
            padding-top: 10px; /* Padding above the paragraph */
          }

          /* Content styling */
          .content {
            padding: 20px;
            text-align: left;
            color: #333333;
          }

          .content h2 {
            font-size: 22px;
            margin: 0 0 10px;
          }

          .content p {
            font-size: 16px;
            margin: 10px 0;
          }

          .otp-blocks {
            display: flex;
            justify-content: center;
            margin: 20px 0;
          }

          .otp-block {
            width: 40px;
            height: 40px;
            border: 2px solid #8dd3bb;
            border-radius: 5px;
            margin: 0 5px;
            line-height: 36px;
            font-size: 18px;
            text-align: center;
            color: #8dd3bb;
          }

          /* Button styling */
          .button {
            display: inline-block;
            background-color: #8dd3bb;
            color: #ffffff;
            padding: 12px 25px;
            border-radius: 5px;
            text-decoration: none;
            font-size: 16px;
            transition: background-color 0.3s ease;
          }

          .button:hover {
            background-color: #68fdc9;
          }

          /* Footer setup */
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #777777;
          }

          /* Responsive design */
          @media only screen and (max-width: 600px) {
            .container {
              width: 90%;
              margin: 20px auto;
            }

            .title {
              padding: 30px 10px;
            }

            .title h1 {
              font-size: 22px;
              padding-bottom: 8px;
            }

            .title p {
              font-size: 18px;
              padding-top: 8px;
            }

            .content h2 {
              font-size: 20px;
            }

            .otp-block {
              width: 35px;
              height: 35px;
              line-height: 31px;
              font-size: 16px;
            }

            .button {
              padding: 10px 20px;
              font-size: 14px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://travmigoz-assethosting.s3.ap-south-1.amazonaws.com/otpEmailAssets/logo.png" alt="Logo" />
          </div>
          <div class="header">
            <h1>THANKS FOR SIGNING UP!</h1>
          </div>
          <div class="title">
            <p>Verify Your E-Mail Address</p>
          </div>
          <div class="content">
            <h2>Hello, ${name}!</h2>
            <p>Please use the following One Time Password (OTP) to verify your email address:</p>
            <div class="otp-blocks">
              ${otp.split("").map(digit => `<div class="otp-block">${digit}</div>`).join("")}
            </div>
            <p>This passcode will only be valid for the next 15 minutes.</p>
            <a href="#" class="button">Verify Email</a>
          </div>
          <div class="footer">
            &copy; 2024 Your Company. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
}

module.exports = generateEmailTemplate;
