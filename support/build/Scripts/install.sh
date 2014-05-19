#!/bin/sh
## NOTE sh NOT bash. This script should be POSIX sh only, since we don't
## know what shell the user has. Debian uses 'dash' for 'sh', for
## example.
###################################################################################################
# This script can be called from a shell prompt using: 
# curl -kL http://get.virtual.wf | sh
###################################################################################################
PREFIX="/usr/local"

set -e
set -u

# Let's display everything on stderr.
exec 1>&2

#######################################
## Check OS Compatibility
#######################################

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

#######################################
## Install VWF Baseline
#######################################


# Starting a clean install here:
[ -e "$HOME/.vwf" ] && rm -rf "$HOME/.vwf"
if [ "$UNAME" = "Darwin" ] ; then
	### OSX ###
	TARBALL_URL="http://download.virtualworldframework.com/files/VWF_Mac_OS_X_latest.tar.gz"
	NODEPACKAGE="node-v0.10.22-darwin-x64"
elif [ "$UNAME" = "Linux" ] ; then
	### Linux ###
	TARBALL_URL="http://download.virtualworldframework.com/files/VWF_Linux_latest.tar.gz"
fi


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


#######################################
## Install Nodejs Baseline
#######################################
	
if [ "$UNAME" = "Darwin" ] ; then
	### OSX ###
	TARBALL_URL="http://nodejs.org/dist/v0.10.22/node-v0.10.22-darwin-x64.tar.gz"
	NODEPACKAGE="node-v0.10.22-darwin-x64"
elif [ "$UNAME" = "Linux" ] ; then
	### Linux ###
	TARBALL_URL="http://nodejs.org/dist/v0.10.22/node-v0.10.22-linux-x64.tar.gz"
	NODEPACKAGE="node-v0.10.22-linux-x64"
fi

if [ ! -f /usr/bin/node ]; then
	if type sudo >/dev/null 2>&1; then
		echo "VWF uses Node.js as an engine. We are installing Node now."
		echo "This may prompt for your password."
		[ -e "$HOME/.vwf/.node" ] && rm -rf "$HOME/.vwf/.node"


		INSTALL_TMPDIR="$HOME/.node-install-tmp"
		if [ -d "$INSTALL_TMPDIR" ];then
		sudo rm -rf "$INSTALL_TMPDIR"
		fi
		mkdir "$INSTALL_TMPDIR"
		echo "Downloading latest Node distribution"

		curl --progress-bar --fail "$TARBALL_URL" | tar -xzf - -C "$INSTALL_TMPDIR"
		# bomb out if it didn't work, eg no net
		#test -x "${INSTALL_TMPDIR}/${NODEPACKAGE}"
		mv "${INSTALL_TMPDIR}/${NODEPACKAGE}/" "$HOME/.vwf/.node"
		if [ -d "$INSTALL_TMPDIR" ];then
		sudo rmdir "${INSTALL_TMPDIR}"
		fi
		# just double-checking :)
		#test -x "$HOME/.vwf/.node"
		sudo ln -sf ~/.vwf/.node/bin/node /usr/bin/node
		sudo ln -sf ~/.vwf/.node/bin/npm /usr/bin/npm
	else
		echo "You need sudo permission to complete Node installation. Node is a web engine that VWF uses to execute."
		echo "Please follow the instructions for installation of Node at http://howtonode.org/how-to-install-nodejs"
	fi
else
		echo "Node installation detected at /usr/bin/node. Continuing..."
fi

#######################################
## Setup Node NPM Packages
#######################################

cd "$HOME/.vwf"
if env | grep -q ^HTTP_PROXY=
then
  npm config set proxy "$HTTP_PROXY"; 
  npm config set https-proxy "$HTTP_PROXY"; 
  echo "NPM proxy has been set to ${HTTP_PROXY}."
else
  echo "NPM proxy has not been set as HTTP_PROXY environment variable is not set. If you are behind a proxy, please make sure your HTTP_PROXY variable is set and re-execute VWF installation."
fi

npm install
echo " "
echo "VWF has been installed in your home directory (~/.vwf)."

#######################################
## Install VWF executable is user's bin
#######################################

LAUNCHER="$HOME/.vwf/support/server/vwf"

if cp "$LAUNCHER" "$PREFIX/bin" >/dev/null 2>&1; then
  echo "Writing a launcher script to $PREFIX/bin/vwf for your convenience."
  cat <<"EOF"
  
  To get started fast:

  $ vwf 

Or see the Getting Started guide at:

  https://virtual.wf/getting_started.html

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

Or see the Getting Started guide at:

  https://virtual.wf/getting_started.html

EOF
  else
    cat <<"EOF"

Couldn't write the launcher script. Please either:

  (1) Run the following as root:
        cp ~/.vwf/support/server/vwf /usr/local/bin/
  (2) Add ~/.vwf to your path, or
  (3) Rerun this command to try again.

Then to get started, take a look at https://virtual.wf/getting_started.html
EOF
  fi
else
  cat <<"EOF"

Now you need to do one of the following:

  (1) Add ~/.vwf to your path, or
  (2) Run this command as root:
        cp ~/.vwf/support/server/vwf /usr/local/bin/

Then to get started, take a look at https://virtual.wf/getting_started.html
EOF
fi


trap - EXIT
