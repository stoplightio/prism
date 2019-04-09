#!/bin/sh

install () {

set -eu

UNAME=$(uname)
ARCH=$(uname -m)
if [ "$UNAME" != "Linux" ] && [ "$UNAME" != "Darwin" ] && [ "$ARCH" != "x86_64" ] && [ "$ARCH" != "i686" ]; then
    echo "Sorry, OS/Architecture not supported: ${UNAME}/${ARCH}. Download binary from https://github.com/stoplightio/prism/releases"
    exit 1
fi

if [ "$UNAME" = "Darwin" ] ; then
  OSX_ARCH=$(uname -m)
  if [ "${OSX_ARCH}" = "x86_64" ] ; then
    PLATFORM="darwin_amd64"
  fi
elif [ "$UNAME" = "Linux" ] ; then
  LINUX_ARCH=$(uname -m)
  if [ "${LINUX_ARCH}" = "i686" ] ; then
    PLATFORM="linux_386"
  elif [ "${LINUX_ARCH}" = "x86_64" ] ; then
    PLATFORM="linux_amd64"
  fi
fi

LATEST=$(curl -s https://api.github.com/repos/stoplightio/prism/tags | grep -Eo '"name":.*"v2.*",' | head -n 1 | sed 's/[," ]//g' | cut -d ':' -f 2)
URL="https://github.com/stoplightio/prism/releases/download/$LATEST/prism_$PLATFORM"
SRC=$(pwd)/prism_$PLATFORM
DEST=/usr/local/bin/prism

if [ -z $LATEST ] ; then
  echo "Error requesting. Download binary from ${URL}"
  exit 1
else
  STATUS=$(curl -sL -w %{http_code} -o $SRC $URL)
  if [ $STATUS -ge 200 ] & [ $STATUS -le 308 ]; then
    mv $SRC $DEST
    chmod +x $DEST
    echo "Prism installation was successful"
  else
    rm $SRC
    echo "Error requesting. Download binary from ${URL}"
    exit 1
  fi
fi
}

install
