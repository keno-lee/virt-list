# virt-list

## 运行

```sh
pnpm i
```

```sh
pnpm dev
```

## 项目目录

```text
.
├─ docs/          # VitePress 文档站点 + playground 宿主
│  ├─ apps/       # 文档内微应用（react/vue/js）
│  │  ├─ js/         # JS 应用
│  │  ├─ react/      # React 应用
│  │  └─ vue/        # Vue 应用
│  ├─ js/         # JS 文档
│  ├─ react/      # React 文档
│  └─ vue/        # Vue 文档
├─ packages/      # npm 发布包
│  ├─ js/         # 核心 virt-list 实现
│  ├─ react/      # React 封装（预留）
│  └─ vue/        # Vue 封装（预留）
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
```
