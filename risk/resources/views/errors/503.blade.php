<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Under Maintenance - Risk Profiling System</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .maintenance-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            padding: 60px 40px;
            text-align: center;
            animation: fadeIn 0.8s ease-in;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .icon-container {
            margin-bottom: 30px;
        }

        .maintenance-icon {
            width: 120px;
            height: 120px;
            margin: 0 auto;
            position: relative;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
        }

        .gear {
            position: absolute;
            width: 60px;
            height: 60px;
            border: 8px solid #667eea;
            border-radius: 50%;
        }

        .gear:before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border: 8px solid #667eea;
            border-radius: 50%;
            top: -8px;
            left: -8px;
            clip-path: polygon(40% 0%, 60% 0%, 60% 100%, 40% 100%);
        }

        .gear:after {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border: 8px solid #667eea;
            border-radius: 50%;
            top: -8px;
            left: -8px;
            clip-path: polygon(0% 40%, 0% 60%, 100% 60%, 100% 40%);
        }

        .gear:nth-child(1) {
            animation: rotate 3s linear infinite;
        }

        .gear:nth-child(2) {
            left: 50px;
            top: 30px;
            animation: rotateReverse 3s linear infinite;
            opacity: 0.7;
        }

        @keyframes rotate {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        @keyframes rotateReverse {
            from {
                transform: rotate(360deg);
            }
            to {
                transform: rotate(0deg);
            }
        }

        h1 {
            color: #333;
            font-size: 2.5em;
            margin-bottom: 20px;
            font-weight: 700;
        }

        .subtitle {
            color: #667eea;
            font-size: 1.3em;
            margin-bottom: 30px;
            font-weight: 600;
        }

        .message {
            color: #666;
            font-size: 1.1em;
            line-height: 1.8;
            margin-bottom: 20px;
        }

        .info-box {
            background: #f8f9ff;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 30px 0;
            text-align: left;
            border-radius: 8px;
        }

        .info-box h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 1.1em;
        }

        .info-box p {
            color: #555;
            line-height: 1.6;
            margin-bottom: 8px;
        }

        .info-box ul {
            margin-left: 20px;
            color: #555;
        }

        .info-box li {
            margin-bottom: 5px;
        }

        .footer {
            margin-top: 40px;
            color: #999;
            font-size: 0.9em;
        }

        .developer-notice {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
            color: #856404;
        }

        @media (max-width: 600px) {
            .maintenance-container {
                padding: 40px 30px;
            }

            h1 {
                font-size: 2em;
            }

            .subtitle {
                font-size: 1.1em;
            }

            .message {
                font-size: 1em;
            }
        }
    </style>
</head>
<body>
    <div class="maintenance-container">
        <div class="icon-container">
            <div class="maintenance-icon">
                <div class="gear"></div>
                <div class="gear"></div>
            </div>
        </div>

        <h1>We'll Be Back Soon!</h1>
        <p class="subtitle">System Under Maintenance</p>

        <p class="message">
            We are currently performing scheduled maintenance to improve your experience
            with the Risk Profiling System. We apologize for any inconvenience this may cause.
        </p>

        <div class="info-box">
            <h3>What's Happening?</h3>
            <p>Our team is working on:</p>
            <ul>
                <li>System upgrades and improvements</li>
                <li>Performance enhancements</li>
                <li>Security updates</li>
                <li>Database optimization</li>
            </ul>
        </div>

        <p class="message">
            We expect to be back online shortly. Thank you for your patience and understanding.
        </p>

        @if(config('app.env') === 'local' || auth()->check() && auth()->user()->hasRole('developer'))
        <div class="developer-notice">
            <strong>🔧 Developer Access:</strong> You have special access during maintenance mode.
            <br>This notice is only visible to developers and whitelisted IPs.
        </div>
        @endif

        <div class="footer">
            <p>If you need immediate assistance, please contact your system administrator.</p>
            <p>&copy; {{ date('Y') }} Risk Profiling System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
