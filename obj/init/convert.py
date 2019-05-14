objpath="colal.obj"
mtlpath="colal.mtl"
outputresource = 'InitResource.js'
#起動時に読み込むデータ(InitResource.js)を作成する（objのままだとローカル環境でのデバッグにひと手間要るので）
#Objの内容をStringデータ化しているだけです
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
    