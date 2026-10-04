"""Generate invented, clearly marked photo fixtures. No personal documents."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parent.parent
folder=root/'public'/'fixtures'
font='/System/Library/Fonts/Supplemental/Arial.ttf'
def statement():
    image=Image.new('RGB',(1000,1250),'white');draw=ImageDraw.Draw(image)
    def text(y,value,size=26):draw.text((55,y),value,font=ImageFont.truetype(font,size),fill='#203c33')
    text(40,'SYNTHETIC DEMO - NOT AN OFFICIAL DOCUMENT',19)
    text(105,'BANK STATEMENT',42);text(175,'Fictional Sample Bank',26)
    text(245,'ACCOUNT PROFILE',26)
    text(320,'Account holder: Avery Example')
    text(392,'Statement mailing address: 14 Fiction Lane')
    text(464,'Account number: DEMO-ACCT-1001')
    text(555,'PERIOD SUMMARY',26)
    text(630,'Closing balance: 4200.00')
    text(702,'Account currency: USD')
    text(774,'Period start: 2026-09-01')
    text(846,'Period end: 2026-09-30')
    text(970,'Review the visible text before using the results.',22)
    image.save(folder/'photo-statement.png',optimize=True)
    covered=image.copy();ImageDraw.Draw(covered).rectangle((245,456,735,504),fill='black');covered.save(folder/'photo-statement-covered.png',optimize=True)
    return image
statement()
drawing=Image.new('RGB',(1000,1250),'white');d=ImageDraw.Draw(drawing)
d.ellipse((250,300,650,700),outline='orange',width=18);d.line((100,900,350,600,680,900),fill='purple',width=20)
d.text((55,40),'SYNTHETIC DRAWING - NOT A DOCUMENT',font=ImageFont.truetype(font,22),fill='black')
drawing.save(folder/'photo-drawing.png',optimize=True)
print('Generated three synthetic photo fixtures; account cover region x245..735/y456..504.')
