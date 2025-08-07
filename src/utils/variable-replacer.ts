import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'dotenv';

const envCache: Record<string, Record<string, string>> = {};

function getEnvFromFile(fileName: string): Record<string, string> {
  const filePath = path.resolve(process.cwd(), fileName);
  if (envCache[filePath]) {
    return envCache[filePath];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const env = parse(content);
    envCache[filePath] = env;
    return env;
  } catch (error) {
    return {};
  }
}

export function replaceVariables(value: string): string {
  const regex = /\${(.+?)}/g;
  return value.replace(regex, (match, placeholder) => {
    const parts = placeholder.split('>');
    if (parts.length !== 2) {
      return match;
    }

    const [envPart, varName] = parts;
    const [,envKeyword, ...envFileNameParts] = envPart.split('.');
    const envFileName = envFileNameParts.join('.');

    if (envKeyword !== 'env') {
      return match;
    }

    const fileName = envFileName ? `.env.${envFileName}` : '.env';
    const envVars = getEnvFromFile(fileName);

    return envVars[varName] || match;
  });
}
