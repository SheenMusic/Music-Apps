#!/bin/bash
# Double-click in Finder. Uses only macOS system Bash, Perl and zip.
set -euo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin
export COPYFILE_DISABLE=1

finish() {
    result=$?
    if [ "$result" -ne 0 ]; then
        printf '\n导出失败（退出码 %s）。请查看上方原因；原仓库文件未被修改。\n' "$result"
    fi
    if [ -t 0 ]; then
        printf '\n按回车关闭窗口…'
        read -r _ || true
    fi
}
trap finish EXIT

ROOT="$(cd -- "$(dirname -- "$0")" && pwd -P)"
if [ ! -x /usr/bin/perl ] || [ ! -x /usr/bin/zip ]; then
    printf '错误：缺少 macOS 系统工具 /usr/bin/perl 或 /usr/bin/zip。\n' >&2
    exit 1
fi
/usr/bin/perl "$ROOT/scripts/export-code.pl" "$ROOT"
OUTPUT="$(dirname -- "$ROOT")/Music-Apps-code-only.zip"
if [ "$(uname -s)" = Darwin ]; then
    if ! /usr/bin/open -R "$OUTPUT"; then
        printf 'ZIP 已生成，但 Finder 无法打开。文件位置：%s\n' "$OUTPUT"
    fi
fi
