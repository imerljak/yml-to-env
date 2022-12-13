import { readFile } from "fs/promises";
import { load } from "js-yaml";
import { homedir } from "os";

export async function parseYaml(options) {
  const raw = await readFile(options.filePath, "utf-8");
  const document = load(raw);
  console.log(await mapToEnv(document));
}

async function mapToEnv(document) {
  const flatObj = flatten(document);
  return applyOverrides(flatObj);
}

async function applyOverrides(obj) {
  const overrides = await overrideMapper();

  return Object.entries(obj)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => overrides(key, value), [])
    .filter((it) => !!it)
    .join("\n");
}

async function overrideMapper() {
  try {
    const raw = await readFile(
      homedir() + "/.yml-to-env/overrides.json",
      "utf-8"
    );
    const json = flatten(JSON.parse(raw));

    return (key, value) => (json[key] ? `${json[key]}=${value}` : undefined);
  } catch (error) {
    return (key, value) => `${key.replace(".", "_").toUpperCase()}=${value}`;
  }
}

function flatten(data) {
  var result = {};
  function recurse(cur, prop) {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      for (var i = 0, l = cur.length; i < l; i++)
        recurse(cur[i], prop + "[" + i + "]");
      if (l == 0) result[prop] = [];
    } else {
      var isEmpty = true;
      for (var p in cur) {
        isEmpty = false;
        recurse(cur[p], prop ? prop + "." + p : p);
      }
      if (isEmpty && prop) result[prop] = {};
    }
  }
  recurse(data, "");
  return result;
}
