FROM ubuntu:18.10

RUN apt-get -qq update \
&& apt-get -qq -y install curl \
&& curl -L https://raw.githack.com/stoplightio/prism/master/install | sh

EXPOSE 4010

ENTRYPOINT [ "prism" ]
