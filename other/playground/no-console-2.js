const disallowedMethods = ['log', 'info', 'warn', 'error', 'dir']

module.exports = {
  meta: {
    docs: {
      description: 'Disallow use of console',
      category: 'Best Practices',
      recommended: true,
    },
  },
  create(context) {
    const consoleUsage = []
    return {
      Identifier(node) {
        if (!deepEqual(node, {name: 'console'})) {
          return
        }
        consoleUsage.push(node)
      },
      'Program:exit'() {
        consoleUsage.forEach(identifier => {
          if (isDisallowedFunctionCall(identifier)) {
            context.report({
              node: identifier.parent.property,
              message: 'Using console is not allowed',
            })
          } else {
            const variableDeclaratorParent = findParent(
              identifier,
              parent => parent.type === 'VariableDeclarator',
            )
            if (variableDeclaratorParent) {
              const references = context
                .getDeclaredVariables(variableDeclaratorParent)[0]
                .references.slice(1)
              references.forEach(reference => {
                if (
                  !deepEqual(reference, {
                    identifier: {
                      parent: {
                        property: isDisallowedFunctionCall,
                      },
                    },
                  })
                ) {
                  return
                }
                context.report({
                  node: reference.identifier.parent.property,
                  message: 'Using console is not allowed',
                })
              })
            }
          }
        })
      },
    }
  },
}

function isDisallowedFunctionCall(identifier) {
  return deepEqual(identifier, {
    parent: {
      type: 'MemberExpression',
      parent: {type: 'CallExpression'},
      property: {
        name: val => disallowedMethods.includes(val),
      },
    },
  })
}

function findParent(node, test) {
  if (test(node)) {
    return node
  } else if (node.parent) {
    return findParent(node.parent, test)
  }
  return null
}

function deepEqual(a, b) {
  return (
    a &&
    b &&
    Object.keys(b).every(bKey => {
      const bVal = b[bKey]
      const aVal = a[bKey]
      if (typeof bVal === 'function') {
        return bVal(aVal)
      }
      return isPrimative(bVal) ? bVal === aVal : deepEqual(aVal, bVal)
    })
  )
}
function isPrimative(val) {
  return val == null || /^[sbn]/.test(typeof val)
}
