# ─── Stage 1: build frontend assets ───────────────────────────────────────────
FROM node:22-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── Stage 2: single production image (nginx + php-fpm + supervisor) ──────────
FROM php:8.3-fpm-alpine AS production

WORKDIR /var/www/html

# System deps + PHP extensions
RUN apk add --no-cache \
        bash \
        curl \
        nginx \
        supervisor \
        libpng-dev \
        libjpeg-turbo-dev \
        libwebp-dev \
        libxml2-dev \
        zip \
        unzip \
        oniguruma-dev \
        icu-dev \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        intl \
        xml \
        opcache \
    && pecl install redis \
    && docker-php-ext-enable redis opcache \
    && rm -rf /tmp/pear

# PHP-FPM: escucha en socket Unix para comunicación con nginx en el mismo contenedor
RUN sed -i 's|listen = 9000|listen = /run/php-fpm.sock|' /usr/local/etc/php-fpm.d/www.conf \
    && sed -i 's|;listen.owner = www-data|listen.owner = nginx|'  /usr/local/etc/php-fpm.d/www.conf \
    && sed -i 's|;listen.group = www-data|listen.group = nginx|'  /usr/local/etc/php-fpm.d/www.conf \
    && sed -i 's|user = www-data|user = nginx|'  /usr/local/etc/php-fpm.d/www.conf \
    && sed -i 's|group = www-data|group = nginx|' /usr/local/etc/php-fpm.d/www.conf

# OPcache config
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# Nginx config
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf

# Supervisor config
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# PHP deps
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# App source + compiled assets
COPY . .
COPY --from=frontend /app/public/build ./public/build

# Bootstrap Laravel
RUN php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache \
    && php artisan storage:link \
    && chown -R nginx:nginx /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
