import { join, normalize, Path } from "@angular-devkit/core";
import * as ts from "typescript";
import {
  apply,
  chain,
  filter,
  mergeWith,
  move,
  noop,
  Rule,
  SchematicContext,
  template,
  Tree,
  url,
} from "@angular-devkit/schematics";
import { Schema } from "./schema";
import { formatFiles, getWorkspace, names, toFileName } from "@nrwl/workspace";
import {
  addDepsToPackageJson,
  addGlobal,
  getProjectConfig,
  insert,
} from "@nrwl/workspace/src/utils/ast-utils";
import { toJS } from "@nrwl/workspace/src/utils/rules/to-js";
const VALID_STYLES = [
  "css",
  "scss",
  "less",
  "styl",
  "styled-components",
  "@emotion/styled",
  "none",
];
export function assertValidStyle(style: string): void {
  if (VALID_STYLES.indexOf(style) === -1) {
    throw new Error(
      `Unsupported style option found: ${style}. Valid values are: "${VALID_STYLES.join(
        '", "',
      )}"`,
    );
  }
}
export const nxVersion = "*";

export const reactVersion = "16.12.0";
export const reactDomVersion = "16.12.0";
export const typesReactVersion = "16.9.17";
export const typesReactDomVersion = "16.9.4";

export const styledComponentsVersion = "5.0.1";
export const typesStyledComponentsVersion = "5.0.1";

export const emotionStyledVersion = "10.0.27";
export const emotionCoreVersion = "10.0.27";

export const reactRouterDomVersion = "5.1.2";
export const typesReactRouterDomVersion = "5.1.3";

export const testingLibraryReactVersion = "9.4.0";

export const reduxjsToolkitVersion = "1.3.2";
export const reactReduxVersion = "7.1.3";
export const typesReactReduxVersion = "7.1.5";

export const eslintPluginImportVersion = "2.19.1";
export const eslintPluginJsxA11yVersion = "6.2.3";
export const eslintPluginReactVersion = "7.17.0";
export const eslintPluginReactHooksVersion = "2.3.0";

export const CSS_IN_JS_DEPENDENCIES: {
  [style: string]: PackageDependencies;
} = {
  "styled-components": {
    dependencies: {
      "styled-components": styledComponentsVersion,
    },
    devDependencies: {
      "@types/styled-components": typesStyledComponentsVersion,
    },
  },
  "@emotion/styled": {
    dependencies: {
      "@emotion/styled": emotionStyledVersion,
      "@emotion/core": emotionCoreVersion,
    },
    devDependencies: {},
  },
};
export interface PackageDependencies {
  dependencies: DependencyEntries;
  devDependencies: DependencyEntries;
}

export interface DependencyEntries {
  [module: string]: string;
}

interface NormalizedSchema extends Schema {
  projectSourceRoot: Path;
  fileName: string;
  className: string;
  styledModule: null | string;
  hasStyles: boolean;
}

export default function (schema: Schema): Rule {
  return async (host: Tree, context: SchematicContext) => {
    const options = await normalizeOptions(host, schema, context);
    return chain([
      createComponentFiles(options),
      addStyledModuleDependencies(options),
      addExportsToBarrel(options),
      options.routing
        ? addDepsToPackageJson(
            { "react-router-dom": reactRouterDomVersion },
            { "@types/react-router-dom": typesReactRouterDomVersion },
          )
        : noop(),
      formatFiles({ skipFormat: false }),
    ]);
  };
}

function createComponentFiles(options: NormalizedSchema): Rule {
  const componentDir = join(options.projectSourceRoot, options.directory);
  return mergeWith(
    apply(url(`./files`), [
      template({
        ...options,
        tmpl: "",
      }),
      options.skipTests ? filter((file) => !/.*spec.tsx/.test(file)) : noop(),
      options.styledModule || !options.hasStyles
        ? filter((file) => !file.endsWith(`.${options.style}`))
        : noop(),
      move(componentDir),
      options.js ? toJS() : noop(),
    ]),
  );
}

function addStyledModuleDependencies(options: NormalizedSchema): Rule {
  const extraDependencies = CSS_IN_JS_DEPENDENCIES[options.styledModule];

  return extraDependencies
    ? addDepsToPackageJson(
        extraDependencies.dependencies,
        extraDependencies.devDependencies,
      )
    : noop();
}

function addExportsToBarrel(options: NormalizedSchema): Rule {
  return async (host: Tree) => {
    const workspace = await getWorkspace(host);
    const isApp =
      workspace.projects.get(options.project).extensions.type === "application";
    return options.export && !isApp
      ? (host: Tree) => {
          const indexFilePath = join(
            options.projectSourceRoot,
            options.js ? "index.js" : "index.ts",
          );
          const buffer = host.read(indexFilePath);
          if (!!buffer) {
            const indexSource = buffer!.toString("utf-8");
            const indexSourceFile = ts.createSourceFile(
              indexFilePath,
              indexSource,
              ts.ScriptTarget.Latest,
              true,
            );

            insert(
              host,
              indexFilePath,
              addGlobal(
                indexSourceFile,
                indexFilePath,
                `export * from './${options.directory}/${options.fileName}';`,
              ),
            );
          }

          return host;
        }
      : noop();
  };
}

async function normalizeOptions(
  host: Tree,
  options: Schema,
  context: SchematicContext,
): Promise<NormalizedSchema> {
  assertValidOptions(options);

  const { className, fileName } = names(options.name);
  const componentFileName = options.pascalCaseFiles ? className : fileName;
  const { sourceRoot: projectSourceRoot, projectType } = getProjectConfig(
    host,
    options.project,
  );

  const directory = await getDirectory(host, options);

  const styledModule = /^(css|scss|less|styl|none)$/.test(options.style)
    ? null
    : options.style;

  if (options.export && projectType === "application") {
    context.logger.warn(
      `The "--export" option should not be used with applications and will do nothing.`,
    );
  }

  return {
    ...options,
    directory,
    styledModule,
    hasStyles: options.style !== "none",
    className,
    fileName: componentFileName,
    projectSourceRoot,
  };
}

async function getDirectory(host: Tree, options: Schema) {
  const fileName = toFileName(options.name);
  const workspace = await getWorkspace(host);
  let baseDir: string;
  if (options.directory) {
    baseDir = options.directory;
  } else {
    baseDir =
      workspace.projects.get(options.project).extensions.projectType ===
      "application"
        ? "app"
        : "lib";
  }
  return options.flat ? baseDir : join(normalize(baseDir), fileName);
}

function assertValidOptions(options: Schema) {
  assertValidStyle(options.style);

  const slashes = ["/", "\\"];
  slashes.forEach((s) => {
    if (options.name.indexOf(s) !== -1) {
      const [name, ...rest] = options.name.split(s).reverse();
      let suggestion = rest.map((x) => x.toLowerCase()).join(s);
      if (options.directory) {
        suggestion = `${options.directory}${s}${suggestion}`;
      }
      throw new Error(
        `Found "${s}" in the component name. Did you mean to use the --directory option (e.g. \`nx g c ${name} --directory ${suggestion}\`)?`,
      );
    }
  });
}
