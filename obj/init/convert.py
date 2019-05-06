objpath="colal.obj"
mtlpath="colal.mtl"
outputresource = 'InitResource.js'
#
with open(outputresource, mode='w') as f:#アウトプットデータの作成
    f.write("var InitObjstr=\"")#Objファイルの初期リソースデータ作成
    with open(objpath) as r:
        line = r.readline().replace("\n", "\\n")
        while line:
            f.writelines(line)
            line = r.readline().replace("\n", "\\n")
        r.close()
    f.write("\"\n")
    f.write("var InitMtlstr=\"")#Mtlファイルの初期リソースデータ作成
    with open(mtlpath) as r:
        line = r.readline().replace("\n", "\\n")
        while line:
            f.writelines(line)
            line = r.readline().replace("\n", "\\n")
        r.close()
    f.write("\"")
    