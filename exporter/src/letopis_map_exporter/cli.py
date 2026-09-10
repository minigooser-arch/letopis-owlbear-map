from __future__ import annotations
import argparse
from pathlib import Path
from .build import build_static_site_map
from .config import load_config

def main() -> None:
    p=argparse.ArgumentParser(prog='letopis-map-export')
    p.add_argument('--config',type=Path,default=Path('exporter/config.example.yml'))
    sub=p.add_subparsers(dest='command',required=True)
    b=sub.add_parser('build'); b.add_argument('--output',type=Path,required=True); b.add_argument('--revision',type=int,required=True)
    args=p.parse_args(); cfg=load_config(args.config)
    if args.command=='build': build_static_site_map(cfg,args.output,args.revision); print(args.output)
if __name__=='__main__': main()
