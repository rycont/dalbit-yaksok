import { Extension } from '@dalbit-yaksok/core'
import conditional from './conditional/grammer'
import counted from './counted/grammer'
import list from './list/grammer'
import unconditioned from './unconditioned/grammer'
import breakCapability from './break/grammer'
import continueCapability from './continue/grammer'

const extension: Extension = {
    capabilties: {
        Grammer: [
            conditional,
            counted,
            list,
            unconditioned,
            breakCapability,
            continueCapability,
        ],
    },
}

export default extension
