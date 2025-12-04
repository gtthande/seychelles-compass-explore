/**
 * Kill Port Script
 * Kills any process using port 5173 before starting dev server
 */

import kill from "kill-port";

kill(5173).catch(() => { });


