export function get( resource ) {
  return fetch( resource, getOptions() ).
    then( responseBody );
}

export function post( resource, body ) {
  return fetch( resource, postOptions( body ) ).
    then( responseBody );
}

function getOptions() {
  return {
    credentials: "same-origin",
  };
}

function postOptions( body ) {
  let json = ( typeof body === "object" ) && ( body !== null ) &&
    ( body instanceof FormData === false );
  return {
    method: "POST",
    body: json ? JSON.stringify( body ) : body,
    headers: json ? { "Content-Type": "application/json" } : null,
    credentials: "same-origin",
  };
}

function responseBody( response ) {
  if ( !response.ok )
    throw Error( response.statusText );
  let contentType = response.headers.get( "Content-Type" ) || "",
    json = contentType.includes( "application/json" );
  return json ? response.json() : response.text();
}
