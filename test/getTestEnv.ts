import { verifyTruthy } from 'cwi-base';
import * as dotenv from 'dotenv';
dotenv.config();


export function getTestEnv() : {
    mainTaalApiKey: string,
    testTaalApiKey: string,
    mainDojoConnection: string,
    testDojoConnection: string
} {
    return {
        mainTaalApiKey: verifyTruthy(process.env.MAIN_TAAL_API_KEY || '', `.env value for 'mainTaalApiKey' is required.`),
        testTaalApiKey: verifyTruthy(process.env.TEST_TAAL_API_KEY || '', `.env value for 'testTaalApiKey' is required.`),
        mainDojoConnection: verifyTruthy(process.env.MAIN_DOJO_CONNECTION || '', `.env value for 'mainDojoConnection' is required.`),
        testDojoConnection: verifyTruthy(process.env.TEST_DOJO_CONNECTION || '', `.env value for 'testDojoConnection' is required.`)
    }
}