# Custodesk
Repository for Custodesk.

# Setup

## Prerequisites
- Apache2
- PHP 8.1+
- MySQL
- Composer
- NodeJS

## Instructions

1. Clone repo into your `htdocs` folder.
2. `cd` into your `htdocs` folder and run `composer install`.
3. `cd` into the `src/build_tools` folder and build CSS, JS, and images:
   ```bash
   npm i
   ./cdbuild # On Windows you should omit `./`
   ```
   <small>If `./cdbuild` fails due to permissions, run `chmod +x cdbuild` before trying again.</small>
3. Start Apache2.