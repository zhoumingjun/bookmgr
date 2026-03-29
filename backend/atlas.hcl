data "external_schema" "ent" {
  program = [
    "go",
    "run",
    "ariga.io/atlas-provider-ent",
    "load",
    "--path", "./ent/schema",
    "--dialect", "postgres",
  ]
}

env "ent" {
  src = data.external_schema.ent.url
  dev = "docker://postgres/16/dev?search_path=public"
  migration {
    dir = "file://migrations"
  }
}

env "local" {
  migration {
    dir = "file://migrations"
  }
}
