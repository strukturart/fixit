<img src="/images/icon.png" width="228"/>

# fixit

As a bicycle courier, I frequently encounter road damage that often takes too long to be addressed by city administration. To streamline this process, I developed this web application to report and document damages efficiently. Users can pinpoint the exact location on a map, capture photos, and provide a detailed description through a simple web form. All reported data is sent directly to an email address for quick action. Ideally, confirmed damages can be integrated into a ticketing system, allowing users to receive updates on the repair status. The client-side is powered by Mithril.js, while PHPMailer handles the server-side email dispatch.

### Features

- share location
- share image

<p float="left">
  <img src="/images/screen-0.jpg" alt="Image 0" width="200" />
  <img src="/images/screen-1.jpg" alt="Image 1" width="200" />
  <img src="/images/screen-2.jpg" alt="Image 2" width="200" />
</p>

### LICENSES

- mithril MIT
- leaflet MIT

### build the thing

- **`npm install`**: Installs Node.js dependencies.
- **`composer install`**: Installs PHP dependencies.
- **`npm run web`**: Runs a predefined script for the project.
- **`.env` file**: Stores environment variables, including SMTP settings, which should be protected and not included in version control.

<code>
SMTP_HOST=xx
SMTP_USER=xx
SMTP_PASS=xx
SMTP_PORT=xx
</code>
