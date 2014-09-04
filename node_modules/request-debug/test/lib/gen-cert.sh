#!/bin/sh

# instructions from http://www.selfsignedcertificate.com/
openssl genrsa -out key.pem 2048
openssl req -new -x509 -key key.pem -out cert.pem -days 3560 -subj /CN=localhost
