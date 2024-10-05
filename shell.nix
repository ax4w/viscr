with import <nixpkgs> { };
with import <nixos-unstable> {};
mkShell {
  packages = [
      go_1_23
      nodejs_22
  ];

  env = {
  };
  
  buildInputs = [
  ];
}
