'use strict'
const debug = require('debug')('moneyd-uplink-coil')
const axios = require('axios')
const inquirer = require('inquirer')

async function configure ({ advanced }) {
  const server = 'btp+wss://coil.com/btp'
  const res = {}
  const fields = [{
    type: 'input',
    name: 'email',
    message: 'Coil email or username:'
  }, {
    type: 'password',
    name: 'password',
    message: 'Coil password:'
  }]

  for (const field of fields) {
    if (advanced || field.default === undefined) {
      res[field.name] = (await inquirer.prompt(field))[field.name]
    } else {
      res[field.name] = field.default
    }
  }

  let response
  try {
    response = await axios({
      method: 'POST',
      url: 'https://coil.com/graphql',
      data: {
        operationName: "Login",
        variables: {
          email: res.email,
          password: res.password
        },
        query: "mutation Login($email: String!, $password: String!) {\n  login(email: $email, password: $password) {\n    token\n    user {\n      ...CurrentUser\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment CurrentUser on User {\n  id\n  email\n  fullName\n  shortName\n  subscription {\n    stripeId\n    plan {\n      stripeId\n      tier\n      cost\n      name\n      __typename\n    }\n    active\n    endDate\n    autoRenew\n    __typename\n  }\n  customerId\n  invitation {\n    code\n    __typename\n  }\n  paymentPointer\n  emailVerify {\n    id\n    verified\n    __typename\n  }\n  intercomHmac\n  currencyPreferences {\n    code\n    scale\n    __typename\n  }\n  trial\n  __typename\n}\n"
      }
    })
  } catch (e) {
    console.error('Error: invalid username or password.') 
    debug('error logging in:', e)
    process.exit(1)
  }

  console.log('logged in successfully.')
  return {
    relation: 'parent',
    plugin: require.resolve('ilp-plugin-btp'),
    assetCode: 'XRP',
    assetScale: 9,
    sendRoutes: false,
    receiveRoutes: false,
    options: {
      assetScale: 9,
      btpToken: response.data.data.login.token,
      server
    }
  }
}

const commands = []

module.exports = {
  configure,
  commands
}
