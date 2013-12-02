#!/bin/sh
## NOTE sh NOT bash. This script should be POSIX sh only, since we don't
## know what shell the user has. Debian uses 'dash' for 'sh', for
## example.
###################################################################################################
# This script can be called from a shell prompt using: 
# curl -L https://get.virtual.wf | /bin/sh
###################################################################################################
PREFIX="/usr/local"

set -e
set -u

# Let's display everything on stderr.
exec 1>&2

UNAME=$(uname)
if [ "$UNAME" != "Linux" -a "$UNAME" != "Darwin" ] ; then
    echo "Sorry, this OS is not supported yet."
    exit 1
fi

if [ "$UNAME" = "Darwin" ] ; then
  ### OSX ###
  if [ "i386" != "$(uname -p)" -o "1" != "$(sysctl -n hw.cpu64bit_capable 2>/dev/null || echo 0)" ] ; then
    # Can't just test uname -m = x86_64, because Snow Leopard can return other values.
    echo "Only 64-bit Intel processors are supported at this time."
    exit 1
  fi
  ARCH="x86_64"
elif [ "$UNAME" = "Linux" ] ; then
  ### Linux ###
  ARCH=$(uname -m)
  if [ "$ARCH" != "i686" -a "$ARCH" != "x86_64" ] ; then
    echo "Unusable architecture: $ARCH"
    echo "VWF only supports i686 and x86_64 at this time."
    exit 1
  fi
fi
PLATFORM="${UNAME}_${ARCH}"
trap "echo Installation failed." EXIT

# Starting a clean install here:
[ -e "$HOME/.vwf" ] && rm -rf "$HOME/.vwf"
TARBALL_URL="http://download.virtualworldframework.com/files/VWF_linux_stable_latest.tar.gz"

INSTALL_TMPDIR="$HOME/.vwf-install-tmp"
if [ -d "$INSTALL_TMPDIR" ];then
rm -rf "$INSTALL_TMPDIR"
fi
mkdir "$INSTALL_TMPDIR"
echo "Downloading latest VWF distribution"

curl --progress-bar --fail "$TARBALL_URL" | tar -xzf - -C "$INSTALL_TMPDIR"
# bomb out if it didn't work, eg no net
test -x "${INSTALL_TMPDIR}/public"
mv "${INSTALL_TMPDIR}" "$HOME/.vwf"
if [ -d "$INSTALL_TMPDIR" ];then
rmdir "${INSTALL_TMPDIR}"
fi
# just double-checking :)
test -x "$HOME/.vwf"
cd "$HOME/.vwf"

echo
echo "VWF has been installed in your home directory (~/.vwf)."


if [ "$UNAME" = "Darwin" ] ; then
	### OSX ###
	echo "Script in progress."
elif [ "$UNAME" = "Linux" ] ; then
	### Linux ###
	ARCH=$(uname -m)
	if [ ! -f /usr/bin/node ]; then
		if type sudo >/dev/null 2>&1; then
			echo "VWF uses Node.js as an engine. We are installing Node now."
			echo "This may prompt for your password."
			[ -e "$HOME/.node" ] && rm -rf "$HOME/.node"
			TARBALL_URL="http://nodejs.org/dist/v0.10.22/node-v0.10.22-linux-x64.tar.gz"

			INSTALL_TMPDIR="$HOME/.node-install-tmp"
			if [ -d "$INSTALL_TMPDIR" ];then
			rm -rf "$INSTALL_TMPDIR"
			fi
			mkdir "$INSTALL_TMPDIR"
			echo "Downloading latest Node distribution"

			curl --progress-bar --fail "$TARBALL_URL" | tar -xzf - -C "$INSTALL_TMPDIR"
			# bomb out if it didn't work, eg no net
			test -x "${INSTALL_TMPDIR}/node-v0.10.22-linux-x64"
			mv "${INSTALL_TMPDIR}/node-v0.10.22-linux-x64/node-v0.10.22-linux-x64/" "$HOME/.node"
			if [ -d "$INSTALL_TMPDIR" ];then
			rmdir "${INSTALL_TMPDIR}"
			fi
			# just double-checking :)
			test -x "$HOME/.node"
			sudo ln -s ~/.node/bin/node /usr/bin/node
			sudo ln -s ~/.node/bin/npm /usr/bin/npm
		else
			echo "You need sudo permission to complete Node installation. Node is a web engine that VWF uses to execute."
			echo "Please follow the instructions for installation of Node at http://howtonode.org/how-to-install-nodejs"
		fi
	else
			echo "Node installation detected at /usr/bin/node. Continuing..."
	fi
fi




LAUNCHER="$HOME/.vwf/support/server/vwf"

if cp "$LAUNCHER" "$PREFIX/bin" >/dev/null 2>&1; then
  echo "Writing a launcher script to $PREFIX/bin/vwf for your convenience."
  cat <<"EOF"
  
  To get started fast:

  $ vwf 

Or see the docs at:

  http://www.virtualworldframework.com/web/docs/introduction.html

EOF
elif type sudo >/dev/null 2>&1; then
  echo "Writing a launcher script to $PREFIX/bin/vwf for your convenience."
  echo "This may prompt for your password."
  
  # New macs (10.9+) don't ship with /usr/local, however it is still in
  # the default PATH. We still install there, we just need to create the
  # directory first.
  if [ ! -d "$PREFIX/bin" ] ; then
      sudo mkdir -m 755 "$PREFIX" || true
      sudo mkdir -m 755 "$PREFIX/bin" || true
  fi

  if sudo cp "$LAUNCHER" "$PREFIX/bin"; then
    cat <<"EOF"

To get started fast:

  $ vwf

Or see the docs at:

  http://www.virtualworldframework.com/web/docs/introduction.html

EOF
  else
    cat <<"EOF"

Couldn't write the launcher script. Please either:

  (1) Run the following as root:
        cp ~/.vwf/support/server/vwf /usr/local/bin/
  (2) Add ~/.vwf to your path, or
  (3) Rerun this command to try again.

Then to get started, take a look at http://www.virtualworldframework.com/web/docs/introduction.html
EOF
  fi
else
  cat <<"EOF"

Now you need to do one of the following:

  (1) Add ~/.vwf to your path, or
  (2) Run this command as root:
        cp ~/.vwf/support/server/vwf /usr/local/bin/

Then to get started, take a look at http://www.virtualworldframework.com/web/docs/introduction.html
EOF
fi


trap - EXIT
