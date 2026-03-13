#!/bin/bash

# Function to run a script and pass failed_scripts array by reference
run_script() {
    local script_name="$1"
    local failed_scripts_ref="$2"  # Reference to the failed_scripts array
    echo "Running $script_name..."

    # Define possible locations
    local current_dir="./$script_name"     # In the current directory
    local child_dir="./scripts/$script_name"     # In the scripts directory

    # Check if the script is in the current directory
    if [ -f "$current_dir" ]; then
        ./"$current_dir"

    # Check if the script is in the child directory
    elif [ -f "$child_dir" ]; then
        ./"$child_dir"

    # Script not found in either location
    else
        echo "$script_name not found in current or scripts directory."
        eval "$failed_scripts_ref+=(\"$script_name\")"  # Add to the failed scripts list
        return 1
    fi

    # Check if the script failed
    if [ $? -ne 0 ]; then
        echo "$script_name failed."
        eval "$failed_scripts_ref+=(\"$script_name\")"  # Add to the failed scripts list
    else
        echo "$script_name succeeded."
    fi
}

# Function to run a script and stop the process if the script fails
run_script_stop_when_fail() {
    local script_name="$1"
    echo "Running $script_name..."

    # Define possible locations
    local current_dir="./$script_name"     # In the current directory
    local child_dir="./scripts/$script_name"     # In the scripts directory

    # Check if the script is in the current directory
    if [ -f "$current_dir" ]; then
        ./"$current_dir"

    # Check if the script is in the child directory
    elif [ -f "$child_dir" ]; then
        ./"$child_dir"

    # Script not found in either location
    else
        echo "$script_name not found in current or scripts directory."
        exit 1  # Exit with status 1 if the script is not found
    fi

    # Check if the script failed
    if [ $? -ne 0 ]; then
        echo "$script_name failed. Stopping the process."
        exit 1  # Exit with status 1 if the script failed
    else
        echo "$script_name succeeded."
    fi
}

# Function to get IP address across platforms
get_ip_address() {
  case "$(uname -s)" in
    Linux*)
      hostname -I | awk '{print $1}'
      ;;
    Darwin*) # macOS
      ipconfig getifaddr $(route -n get default | grep interface | awk '{print $2}')
      ;;
    MINGW*|MSYS*|CYGWIN*) # Windows with Git Bash or similar
      ipconfig | grep -A 5 "Wireless\|Ethernet" | grep "IPv4" | head -1 | awk '{print $NF}'
      ;;
    *)
      echo "127.0.0.1" # Fallback to localhost
      ;;
  esac
}

# Function to start docker compose based on SSL preference
start_flowinquiry() {
  local install_dir="$1"

  # Persist the version to a .env file so future `docker compose` runs
  # (e.g. manual restarts) also use the pinned version.
  if [ -n "$FLOWINQUIRY_VERSION" ]; then
    echo "FLOWINQUIRY_VERSION=$FLOWINQUIRY_VERSION" > "$install_dir/.env"
    echo "📌 Pinned version $FLOWINQUIRY_VERSION saved to $install_dir/.env"
  fi

  echo "🔒 SSL Configuration"
  echo "SSL is recommended when installing FlowInquiry for production use or when accessing from anywhere."
  echo "For local testing purposes, you may not need SSL."
  read -p "Do you want to set up FlowInquiry with SSL? (y/n): " use_ssl

  if [[ "$use_ssl" =~ ^[Yy]$ ]]; then
      echo "✅ Setting up with SSL (HTTPS)"
      services_file="$install_dir/services_https.yml"
      docker compose -f "$services_file" up
  else
      echo "⚠️ Setting up without SSL (HTTP only)"
      services_file="$install_dir/services_http.yml"
      export HOST_IP=$(get_ip_address)
      echo "Using host IP address: $HOST_IP"
      echo "Your service will be available at: http://$HOST_IP:1234"
      docker compose -f "$services_file" up
  fi
}