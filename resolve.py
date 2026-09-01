import sys, re
content = open(r'c:\Users\USER\Desktop\iti\SmartRoadmap\apps\web\src\app\Navbar.tsx', 'r', encoding='utf-8').read()

def replacer(match):
    ours = match.group(1)
    theirs = match.group(2)
    
    if 'isLinkActive' in ours and 'text-[#10B981]' in ours and '?' in ours:
        if '?' in theirs and 'text-[#10B981]' in theirs:
            return theirs
            
    if 'Primary core links' in ours and 'LEARNER nav' in theirs:
        return '          {/* Primary core links / LEARNER nav */}\n          {(user?.role !== "admin" || isLearner || isAdmin) && (\n'
        
    if 'Explore Dropdown' in ours and 'Explore Dropdown' in theirs:
        return '          {/* Explore Dropdown */}\n          {user?.role !== "admin" && (\n            <div className="dropdown dropdown-hover dropdown-bottom dropdown-end">\n'
        
    if 'user.role !== "admin"' in ours and 'isLearner || isAdmin' in theirs:
        return ours + '\n' + theirs

    return ours + '\n' + theirs

new_content = re.sub(r'<<<<<<< ours\n(.*?)=======\n(.*?)>>>>>>> theirs\n', replacer, content, flags=re.DOTALL)
open(r'c:\Users\USER\Desktop\iti\SmartRoadmap\apps\web\src\app\Navbar.tsx', 'w', encoding='utf-8').write(new_content)
