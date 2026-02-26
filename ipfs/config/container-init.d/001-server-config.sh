#!/bin/sh
set -e

# Configure the IPFS gateway to listen on all interfaces
# so Kamal proxy can reach it for SSL termination
ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080

# Keep the API bound to localhost only (security)
ipfs config Addresses.API /ip4/127.0.0.1/tcp/5001
