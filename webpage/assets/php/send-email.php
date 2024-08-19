<?php

/// Load Composer's autoloader
require './vendor/autoload.php';

// Load environment variables from .env file
// Check if the request method is POST and if there is any POST data
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || empty($_POST)) {
    // Optionally, you can send a response or an error message before exiting
    echo "403";
    exit();
}


try {
    $dotenv = Dotenv\Dotenv::createImmutable($_SERVER['DOCUMENT_ROOT']);
    $dotenv->load();
} catch (\Dotenv\Exception\InvalidPathException $e) {
    echo "Error loading .env file: " . $e->getMessage();
    exit();
}





// Now you can use the environment variables in your script
$smtpHost = $_ENV['SMTP_HOST'];
$smtpUser = $_ENV['SMTP_USER'];
$smtpPass = $_ENV['SMTP_PASS'];
$smtpPort = $_ENV['SMTP_PORT'];

// Use these variables with PHPMailer
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host = $smtpHost;
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
    $mail->SMTPSecure = 'ssl';
    $mail->Port = $smtpPort;

    // Recipients
    $mail->setFrom('info@velokurierbiel.ch');
    $mail->addAddress('strukturart@gmail.com');

    // Form data
    $lat = isset($_POST['lat']) ? $_POST['lat'] : '';
    $lng = isset($_POST['lng']) ? $_POST['lng'] : '';
    $email = isset($_POST['email']) ? $_POST['email'] : '';
    $id = isset($_POST['id']) ? $_POST['id'] : '';
    $description = isset($_POST['description']) ? $_POST['description'] : '';

    if ($email !== "null" || $email == "") {
        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            echo "Invalid email address.";
            exit();
        }
    }

    if ($description == "") {
        echo "description is empty";
        exit();
    }



    // Process the image (if any)
    if (isset($_POST['img']) && $_POST['img'] && $_POST['img'] !== null) {
        // Extract base64 string (assuming the image is in base64 format)
        $dataURL = $_POST['img'];
        list($type, $data) = explode(';', $dataURL);
        list(, $data) = explode(',', $data);
        $data = base64_decode($data);

        // Attach the image as an inline attachment
        $mail->addStringEmbeddedImage($data, 'inlineimg', 'image.png', PHPMailer::ENCODING_BASE64, 'image/jpeg');
    }

    // Email content
    $mail->isHTML(true);
    $mail->Subject = 'Form Submission';
    $mail->Body = "Form submission details:<br>
                   Description: $description<br>
                   Latitude: $lat<br>
                   Longitude: $lng<br>
                   Email: $email<br>
                   ID: $id<br>";

    // Include inline image if present
    if (isset($_POST['img']) && $_POST['img']  && $_POST['img'] !== null) {
        $mail->Body .= '<img src="cid:inlineimg">';
    }

    $mail->send();
    echo 'Message has been sent';
} catch (Exception $e) {
    echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}" . $smtpPort . "hh";
}
