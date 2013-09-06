# Results

## [run_id, stream], sorted by when

prefix: results
key:    <run_id>:<stream>:<when>
value:  <data>


# Runs

## [repo], sorted by when

prefix: runs-sorted
key:    <repo>:<when>
value:  <run_id>

## [repo, run_id]

prefix: runs
key:    <repo>:<run_id>
value:  <run_id>