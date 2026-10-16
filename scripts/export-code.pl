#!/usr/bin/perl
# Core Perl modules only; ships with macOS. No source files are written.
# All paths are repository-relative inside the ZIP, including empty directories.
# Images, SVG, PDFs and text are retained. Other binaries >= 25 MiB are skipped.
# Existing output is replaced only after a complete new ZIP has been created.
use strict;
use warnings;
use File::Find qw(find);
use File::Temp qw(tempdir);
use File::Basename qw(dirname basename);
use File::Spec;

# Inaccessible directories must fail the export instead of silently disappearing.
$SIG{__WARN__} = sub { die "错误：$_[0]" };

my $root = shift @ARGV or die "错误：未提供仓库目录。\n";
chdir $root or die "错误：无法读取仓库目录：$!\n";
my $parent = dirname($root);
my $output = File::Spec->catfile($parent, 'Music-Apps-code-only.zip');
die "错误：输出路径是符号链接或目录：$output\n" if -l $output || -d $output;
my $temp = tempdir('.Music-Apps-export-XXXXXXXX', DIR => $parent, CLEANUP => 1);
my $archive = File::Spec->catfile($temp, 'export.zip');
my (@entries, %excluded);
my $large_limit = 25 * 1024 * 1024;

sub skip_entry {
    my ($reason, $path) = @_;
    $excluded{$reason}++;
    # No file contents (especially credentials) are printed.
    print "跳过 [$reason] $path\n" if $reason ne '音视频';
}

find({ no_chdir => 1, wanted => sub {
    my $path = $File::Find::name;
    return if $path eq '.';
    my $name = lc basename($path);
    my $is_dir = -d $path && !-l $path;
    my $reason;
    if (-l $path) {
        $reason = '符号链接'; # Never follow links, including links to secrets outside the repo.
    } elsif ($name =~ /^(?:\.git|\.svn|\.hg|__macosx|node_modules|bower_components|\.cache|\.parcel-cache|\.next|\.nuxt|\.turbo|\.sass-cache|__pycache__|\.pytest_cache|\.mypy_cache|\.ruff_cache|\.tox|\.venv|venv|\.npm|\.yarn|coverage|\.nyc_output|tmp|temp)$/
        || $name =~ /^(?:\.ds_store|thumbs\.db|desktop\.ini)$/
        || $name =~ /(?:\.(?:pyc|pyo|log|tmp|temp|swp|swo|bak)|~)$/
        || $name =~ /^\._/) {
        $reason = 'Git、依赖或缓存';
    } elsif ($name =~ /^\.env(?:\..*)?$/ || $name =~ /\.env$/
        || $name =~ /^(?:\.ssh|\.aws|\.azure|\.gcloud|\.gnupg|\.config|\.netrc|_netrc|\.npmrc|\.pypirc|\.git-credentials|\.gitconfig|\.dockercfg|\.docker|\.terraform|\.kube|\.gitmodules)$/
        || $name =~ /^(?:id_rsa|id_dsa|id_ecdsa|id_ed25519)(?:\..*)?$/
        || $name =~ /(?:^|[._-])(?:secrets?|credentials?|tokens?|service[._-]?account)(?:[._-]|$)/
        || $name =~ /\.(?:pem|key|p12|pfx|keystore|jks|mobileprovision|tfstate)(?:\..*)?$/) {
        $reason = '敏感文件';
    } elsif (!$is_dir && $name =~ /\.(?:mp4|m4v|mov|qt|avi|mkv|webm|wmv|flv|mpeg|mpg|m2v|mts|m2ts|3gp|3g2|ogv|vob|mp3|wav|wave|m4a|m4b|aac|aif|aiff|aifc|flac|ogg|oga|opus|wma|caf|alac|mid|midi|amr|ape)$/) {
        $reason = '音视频';
    } elsif (!$is_dir && $name =~ /\.(?:zip|7z|rar|tar|tgz|gz|bz2|xz|dmg|iso|pkg|exe|dll|so|dylib|o|class)$/) {
        $reason = '归档或编译产物';
    } elsif (!$is_dir && !-f $path) {
        $reason = '非普通文件';
    }
    if ($reason) {
        $File::Find::prune = 1 if $is_dir;
        skip_entry($reason, $path);
        return;
    }
    die "错误：文件名包含换行，无法安全打包：请检查仓库文件名。\n" if $path =~ /[\r\n]/;
    if (!$is_dir) {
        die "错误：无法读取文件 $path\n" unless -r $path;
        my $is_text = -T $path;
        if (!$is_text && -s $path >= $large_limit && $name !~ /\.(?:png|jpe?g|gif|webp|avif|heic|heif|bmp|tiff?|ico|svg|pdf)$/) {
            skip_entry('大型二进制 >=25 MiB', $path);
            return;
        }
        if ($is_text) {
            open my $in, '<', $path or die "错误：无法读取 $path：$!\n";
            my $sensitive = 0;
            while (my $line = <$in>) {
                if ($line =~ /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/
                    || $line =~ /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,}|AKIA[A-Z0-9]{16}|sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/) {
                    $sensitive = 1;
                    last;
                }
            }
            die "错误：读取 $path 失败：$!\n" if !$sensitive && !eof($in);
            close $in or die "错误：读取 $path 失败：$!\n";
            if ($sensitive) {
                skip_entry('疑似私钥或访问令牌', $path);
                return;
            }
        }
    }
    push @entries, $is_dir ? "$path/" : $path;
}}, '.');

die "错误：没有可导出的文件。\n" unless @entries;
@entries = sort @entries;
print "\n正在打包 ", scalar(@entries), " 个文件及目录…\n";
# zip does not recurse: only explicitly selected entries are read.
# -X strips extra attributes; a fresh archive prevents stale excluded entries.
open my $zip, '|-', '/usr/bin/zip', '-q', '-X', $archive, '-@'
    or die "错误：无法启动系统 zip：$!\n";
print {$zip} "$_\n" for @entries;
close $zip or die "错误：zip 打包失败（状态 $?）；请检查读取权限及剩余磁盘空间。\n";
rename $archive, $output or die "错误：无法保存 ZIP 至 $output：$!\n";
my $size = -s $output;
printf "\n导出完成：%s\nZIP 大小：%.2f MiB（%d 字节）\n", $output, $size / 1048576, $size;
print "排除统计：\n";
print "  $_：$excluded{$_}\n" for sort keys %excluded;
print "原仓库文件未修改。图片、SVG、PDF、开发文档和脚本已按相对路径保留。\n";
