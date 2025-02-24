import * as assert from 'assert'
import { watchUnitAndLog } from '../../../../debug'
import Throw from '../../../../system/f/control/Throw'
import { system } from '../../../util/system'

const t = new Throw(system)

t.play()

false && watchUnitAndLog(t)

t.push('message', 'boom')
assert.equal(t.getErr(), 'boom')
assert.equal(t.peakInput('message'), 'boom')
assert.equal(t.takeErr(), 'boom')
assert.equal(t.peakInput('message'), undefined)
assert.equal(t.getErr(), null)
