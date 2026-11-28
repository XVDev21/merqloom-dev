import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

export async function createOperator(db, backendUrl, email, password) {
  // The supported CLI creates an invite; credentials stay out of argv and logs.
  try {
    execFileSync('pnpm', ['--dir','apps/backend','exec','medusa','user','--invite','--email',email], {
      env:{...process.env, MEDUSA_DISABLE_TELEMETRY:'true'}, stdio:'ignore', timeout:60000,
    })
    const invite = await db.query('select token from invite where email=$1 and deleted_at is null', [email])
    assert.equal(invite.rows.length, 1)
    const registered = await fetch(`${backendUrl}/auth/user/emailpass/register`, {
      method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({email,password}),
    })
    assert.equal(registered.status, 200)
    const {token} = await registered.json()
    assert.ok(token)
    const accepted = await fetch(`${backendUrl}/admin/invites/accept?${new URLSearchParams({token:invite.rows[0].token})}`, {
      method:'POST', headers:{authorization:`Bearer ${token}`, 'content-type':'application/json'},
      body:JSON.stringify({email,first_name:'Demo',last_name:'Operator'}),
    })
    assert.equal(accepted.status, 200)
    const login = await fetch(`${backendUrl}/auth/user/emailpass`, {
      method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({email,password}),
    })
    assert.equal(login.status, 200)
    const authenticated = await login.json()
    assert.ok(authenticated.token)
    return authenticated.token
  } catch { throw new Error('Disposable native operator setup failed') }
}
