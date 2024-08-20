<?php

/// Load Composer's autoloader
require './vendor/autoload.php';

$config = HTMLPurifier_Config::createDefault();
$purifier = new HTMLPurifier($config);


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

    // Form data
    $lat = isset($_POST['lat']) ? $_POST['lat'] : '';
    $lat = filter_var($lat, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    if ($lat == false && filter_var($lat, FILTER_VALIDATE_FLOAT) == false) {
        echo "invalid";
    }

    $lng = isset($_POST['lng']) ? $_POST['lng'] : '';
    $lng = filter_var($lng, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    if ($lng == false && filter_var($lng, FILTER_VALIDATE_FLOAT) == false) {
        echo "invalid";
    }

    //swap lat - lng
    $temp = $lng;
    $lng = $lat;
    $lng = $temp;

    $id = isset($_POST['id']) ? $_POST['id'] : '';
    if (!empty($id)) {
        $id = "Schadensnummer " . $id;
    } else {
        echo "invalid";
        exit();
    }


    $updateUser = isset($_POST['updateUser']) ? $_POST['updateUser'] : null;

    // Check if the value is a valid boolean
    if (filter_var($updateUser, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) === null) {
        echo "invalid";
        exit();
    }




    $description = isset($_POST['description']) ? $_POST['description'] : '';
    $description = strip_tags($description);
    $description = $purifier->purify($description);

    if ($description == "") {
        echo "description is empty";
        exit();
    }



    $email = isset($_POST['email']) ? $_POST['email'] : '';

    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        echo "Invalid email address.";
        exit();
    }

    //text


    if ($updateUser == true) {
        $updateUser = "Wir werden dich über den Verlauf des Schadens informieren.";
    }






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
    $mail->addAddress($email);
    $mail->WordWrap = 1550; // Set word wrap to 50 characters
    $mail->isHTML(true); // Set email format to HTML
    $mail->CharSet = "UTF-8";


    // Process the image (if any)
    if (isset($_POST['img']) && $_POST['img'] && $_POST['img'] !== null) {
        // Extract base64 string (assuming the image is in base64 format)
        $dataURL = $_POST['img'];
        list($type, $data) = explode(';', $dataURL);
        list(, $data) = explode(',', $data);
        $data = base64_decode($data);

        // Attach the image as an inline attachment
        $mail->addStringEmbeddedImage($data, 'inlineimg', 'image.jpeg', PHPMailer::ENCODING_BASE64, 'image/jpeg');
    }

    // Email content
    $mail->isHTML(true);
    $mail->Subject = 'fixit - debug your city';
    $mail->Body =
        '<html>

	
		<head>
		<style type="text/css">
		@import url("http://fonts.googleapis.com/css?family=Roboto");
		p, h1, h2, h3, h4, ol, li, ul { font-family: "Roboto", "Arial";  }
		h1{font-weght:bold; font-size:24px;}
		</style>
		
		<title>Fixit Meldung</title>
		<link href="http://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" type="text/css">
		</head>
		<body style="font-family: Roboto; font-size:18px; line-height: 16px; width: 800px; padding: 30px 100px 60px;">
		<div style="width: 700px; line-height: 1.33; padding: 20px 20px 40px; background-color: rgba(56, 58, 64, 0.06);">
		<img src="https://fixit.velokurierbiel.ch/assets/icons/intro.png" width="160px">
		<br>
		<br>
        Vielen Dank für deine Meldung!<br><br> Wir freuen uns über deine Unterstützung und Mitarbeit, um unsere Stadt in Schuss zu halten. Dein Hinweis hilft uns, Schäden schnell zu beheben und unsere Infrastruktur in einem guten Zustand zu halten. <br>Wir kümmern uns so schnell wie möglich darum und halten dich auf dem Laufenden.
        <br>
        <br>
        Merci beaucoup pour ton message !<br><br>  Nous nous réjouissons de ton soutien et de ta collaboration pour maintenir notre ville en bon état. Nous nous en occuperons le plus rapidement possible et nous te tiendrons au courant.  
        <br>

		<div>' . $description . '<br><br>' . $email . '<br><br><a href="https://www.openstreetmap.org/?mlat=' . $lat . '&mlon=' . $lng . '9#map=18/' . $lat . '/' . $lng . '&layers=C">Standort des Schadens</a>' . '<br><br>' . $id . '<br><br>' . $updateUser . '

<br>
<br>
		';

    // Include inline image if present
    if (isset($_POST['img']) && $_POST['img']  && $_POST['img'] !== null) {
        $mail->Body .= '<img src="cid:inlineimg">';
    }

    $mail->Body .= '
    </div>
	</div>
    <div style="width: 700px;
	padding: 20px 20px 40px;
	background-color: #383a40; color: #fff; line-height: 1.33;">
	<strong>Velokurier Biel/Bienne GmbH</strong><br>
	Ring 13<br>
	2502 Biel/Bienne<br>
	<br>
	T 032 365 80 80<br>
	<br<
	<a style="font-color:white;" href="mailto:info@velokurierbiel.ch">info@velokurierbiel.ch</a>
	</div>
	
		</body>
		</html>';

    $mail->send();
    echo 'Message has been sent';
} catch (Exception $e) {
    echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}" . $smtpPort . "hh";
}
