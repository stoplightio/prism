# Docker Example for Prism API Server by [Stoplight](http://stoplight.io/?utm_source=github&utm_medium=prism)

### Prism can be run in docker ###

Prism's docker images can be found on [stoplight's dockerhub](https://hub.docker.com/r/stoplight/prism).

The same commands are available in prism for docker in the prism terminal command.

```shell
# get the help for conduct
docker run --rm stoplight/prism help conduct

# run a conduct command
docker run --rm -v $(pwd):/tmp stoplight/prism:latest conduct --spec /tmp/petstore.json
```