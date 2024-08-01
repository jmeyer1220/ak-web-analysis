{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x  # Use a more secure version of Node.js
    pkgs.chromium
  ];
}