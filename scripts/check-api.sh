#!/usr/bin/env bash
# Usage: start the app (npm run build && npm start), then: npm run check:api
# Asserts the status code of every endpoint. Exits non-zero on the first mismatch.
BASE="${BASE:-http://localhost:3000}"
JAR="$(mktemp)"
fail=0

check() { # name expected_status curl-args...
  local name="$1" want="$2"; shift 2
  local got; got=$(curl -s -o /dev/null -w '%{http_code}' "$@")
  if [ "$got" = "$want" ]; then echo "PASS $name ($got)"; else echo "FAIL $name: wanted $want, got $got"; fail=1; fi
}
J='content-type: application/json'
GOOD='{"name":"Abebe","phone":"+1 555 123 4567","address":"12 Bole Rd","items":[{"id":"1","qty":2}]}'

check "GET /api/dishes"              200 "$BASE/api/dishes"
check "GET /api/dishes/1"            200 "$BASE/api/dishes/1"
check "GET /api/dishes/999"          404 "$BASE/api/dishes/999"
# Orders need a signed-in user. Two customers and one staff member (see lib/users.js).
JAR2="$(mktemp)"; JARK="$(mktemp)"
login() { # jar email password
  curl -s -o /dev/null -c "$1" -X POST -H "$J" -d "{\"email\":\"$2\",\"password\":\"$3\"}" "$BASE/api/session"
}
check "POST /api/session wrong password" 401 -X POST -H "$J" -d '{"email":"abel@example.com","password":"nope"}' "$BASE/api/session"
check "POST /api/session unknown email"  401 -X POST -H "$J" -d '{"email":"nobody@example.com","password":"x"}' "$BASE/api/session"
login "$JAR"  abel@example.com abel-password
login "$JAR2" selam@example.com selam-password
login "$JARK" kitchen@addis-eats.test kitchen-password
check "POST order signed out"        401 -X POST -H "$J" -d "$GOOD" "$BASE/api/orders"
check "POST bad JSON"                400 -X POST -H "$J" -d '{oops' "$BASE/api/orders"
check "POST invalid body"            422 -X POST -H "$J" -d '{"name":"A","items":[]}' "$BASE/api/orders"
check "POST unknown dish id"         422 -X POST -H "$J" -d '{"name":"Abebe","phone":"+1 555 123 4567","address":"12 Bole Rd","items":[{"id":"99","qty":1}]}' "$BASE/api/orders"
check "POST qty 0"                   422 -X POST -H "$J" -d '{"name":"Abebe","phone":"+1 555 123 4567","address":"12 Bole Rd","items":[{"id":"1","qty":0}]}' "$BASE/api/orders"
check "POST client-sent price ignored, still 201" 201 -c "$JAR" -X POST -H "$J" -d '{"name":"Abebe","phone":"+1 555 123 4567","address":"12 Bole Rd","items":[{"id":"1","qty":2,"price":0}]}' "$BASE/api/orders"
check "POST valid order"             201 -c "$JAR" -X POST -H "$J" -d "$GOOD" "$BASE/api/orders"
check "GET /orders with session"     200 -b "$JAR" "$BASE/orders"
check "GET /orders signed out redirects" 307 "$BASE/orders"
check "GET /checkout signed out redirects" 307 "$BASE/checkout"

# Polling endpoint: owner sees it, a visitor with no session does not.
ID=$(curl -s -b "$JAR" -X POST -H "$J" -d "$GOOD" "$BASE/api/orders" | sed -n 's/.*"order":{"id":"\([^"]*\)".*/\1/p')
check "GET /api/orders/:id as owner"  200 -b "$JAR" "$BASE/api/orders/$ID"
check "GET /api/orders/:id no session" 401 "$BASE/api/orders/$ID"
check "GET /api/orders/:id other user" 404 -b "$JAR2" "$BASE/api/orders/$ID"
check "GET /api/orders/:id as staff (not owner)" 404 -b "$JARK" "$BASE/api/orders/$ID"

# Staff-only route: 401 signed out, 403 customer, 200 staff.
check "GET /api/kitchen/orders signed out" 401 "$BASE/api/kitchen/orders"
check "GET /api/kitchen/orders customer"   403 -b "$JAR" "$BASE/api/kitchen/orders"
check "GET /api/kitchen/orders staff"      200 -b "$JARK" "$BASE/api/kitchen/orders"
check "GET /kitchen signed out redirects"  307 "$BASE/kitchen"
check "GET /kitchen customer is 404"       404 -b "$JAR" "$BASE/kitchen"
check "GET /kitchen staff"                 200 -b "$JARK" "$BASE/kitchen"

# A forged cookie passes the middleware (cookie exists) but not getSession().
check "GET /api/orders/:id forged cookie"  401 -b "session=u_abel.forged" "$BASE/api/orders/$ID"

# Search and paging
check "GET /api/dishes?q=doro"        200 "$BASE/api/dishes?q=doro&page=1&pageSize=3"
check "GET /api/dishes?page=0"        422 "$BASE/api/dishes?page=0"
check "GET /api/dishes?pageSize=999"  422 "$BASE/api/dishes?pageSize=999"
rm -f "$JAR" "$JAR2" "$JARK"
exit $fail
