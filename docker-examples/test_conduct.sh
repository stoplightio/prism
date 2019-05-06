#!/bin/bash
set -e

echo '--------------------'
echo ''
echo 'get help for prism conduct'

# get help for conduct
docker run --rm -v $(pwd):/tmp -w /temp stoplight/prism help conduct

echo ''
echo '--------------------'
echo ''
echo 'run prism conduct example'

docker run --rm -v $(pwd):/tmp stoplight/prism:v2.0.20 conduct --spec /tmp/petstore.json

echo ''
echo ''
echo ''
echo 'COMPLETED SUCCESSFULLY'
